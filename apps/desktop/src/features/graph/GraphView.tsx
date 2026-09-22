import { useEffect, useRef, useState } from "react";
import cytoscape, { type Core, type NodeSingular } from "cytoscape";
import type { Discipline } from "@the-desk/shared";
import { useGraph } from "./api";
import type { GraphNodeDto } from "./types";

const KIND_SHAPE: Record<GraphNodeDto["kind"], string> = {
  note: "ellipse",
  flashcard: "diamond",
  task: "round-rectangle",
};

const MASTERY_COLOR: Record<string, string> = {
  unfamiliar: "#a1a1aa",
  learning: "#eab308",
  familiar: "#3b82f6",
  mastered: "#22c55e",
};

// Zoom below this shows only cluster labels (Kumu-style: zoomed out reveals
// structure, zoomed in reveals individual notes) — leaf labels would just be
// clutter at this scale.
const LABEL_ZOOM_THRESHOLD = 0.9;

export function GraphView({
  userId,
  discipline,
  onOpenNote,
}: {
  userId: string;
  discipline: Discipline;
  onOpenNote: (pageId: string) => void;
}) {
  const { data, isLoading } = useGraph(userId, discipline);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; label: string; kind: string } | null>(
    null,
  );

  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Cytoscape has its own style engine and parses color values itself — it
    // does not understand CSS custom properties, so var(--color-*) silently
    // fails validation and falls back to defaults. Resolve to literal colors
    // from the DOM instead (the theme is already applied via data-discipline).
    const rootStyle = getComputedStyle(document.documentElement);
    const themeColor = (name: string, fallback: string) => rootStyle.getPropertyValue(name).trim() || fallback;
    const colorText = themeColor("--color-text", "#18181b");
    const colorTextMuted = themeColor("--color-text-muted", "#52525b");
    const colorSurface = themeColor("--color-surface", "#ffffff");
    const colorBorder = themeColor("--color-border", "#d4d4d8");

    const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max)}…` : s);

    const clusters = [...new Set(data.nodes.map((n) => n.cluster))];
    const elements = [
      ...clusters.map((c) => ({ data: { id: `cluster:${c}`, label: c } })),
      ...data.nodes.map((n) => ({
        data: {
          id: n.id,
          label: truncate(n.label, 24),
          kind: n.kind,
          mastery: n.mastery ?? "unfamiliar",
          parent: `cluster:${n.cluster}`,
        },
      })),
      ...data.edges.map((e) => ({ data: { id: e.id, source: e.source, target: e.target } })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node[kind]",
          style: {
            shape: (el: NodeSingular) => KIND_SHAPE[el.data("kind") as GraphNodeDto["kind"]] as never,
            "background-color": (el: NodeSingular) => MASTERY_COLOR[el.data("mastery")] ?? "#a1a1aa",
            width: 26,
            height: 26,
            label: "data(label)",
            "font-size": 9,
            color: colorText,
            "text-valign": "bottom",
            "text-margin-y": 4,
            "border-width": 1.5,
            "border-color": colorSurface,
          },
        },
        {
          selector: "node:parent",
          style: {
            "background-color": colorSurface,
            "background-opacity": 0.6,
            "border-width": 1,
            "border-color": colorBorder,
            // Reserves margin inside each cluster's boundary — cose accounts
            // for this when packing compounds, which is a more predictable
            // way to keep adjacent small clusters from touching than tuning
            // global repulsion/edge-length constants against every layout.
            padding: "24px",
            label: "data(label)",
            "font-size": 11,
            "font-weight": 600,
            color: colorTextMuted,
            "text-valign": "top",
            "text-halign": "center",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": colorBorder,
            "curve-style": "bezier",
            "target-arrow-shape": "none",
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        padding: 60,
        // Denser than cose's defaults for this node count — without it, same-
        // cluster siblings (e.g. several tasks) pack close enough that their
        // labels overlap into unreadable clutter.
        nodeRepulsion: () => 9000,
        idealEdgeLength: () => 90,
        componentSpacing: 120,
      },
      minZoom: 0.3,
      maxZoom: 2.5,
    });

    cyRef.current = cy;
    cy.fit(undefined, 60);

    // Dev-only: lets e2e checks click a node's real rendered position without
    // guessing coordinates from a force layout that isn't seeded/deterministic.
    // Never present in a production build.
    if (import.meta.env.DEV) {
      (window as unknown as { __cyGraph?: Core }).__cyGraph = cy;
    }

    function applyZoomLabelVisibility() {
      const showLeafLabels = cy.zoom() >= LABEL_ZOOM_THRESHOLD;
      cy.nodes("[kind]").style("text-opacity", showLeafLabels ? 1 : 0);
    }
    applyZoomLabelVisibility();
    cy.on("zoom", applyZoomLabelVisibility);

    cy.on("tap", "node[kind]", (evt) => {
      const node = evt.target;
      if (node.data("kind") === "note") {
        const pageId = (node.id() as string).replace(/^page:/, "");
        onOpenNote(pageId);
      }
    });

    cy.on("mouseover", "node[kind]", (evt) => {
      const node = evt.target;
      const pos = node.renderedPosition();
      setHover({ x: pos.x, y: pos.y, label: node.data("label"), kind: node.data("kind") });
    });
    cy.on("mouseout", "node[kind]", () => setHover(null));

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [data, onOpenNote]);

  if (isLoading || !data) {
    return <div className="p-10 text-sm text-[var(--color-text-muted)]">Loading graph…</div>;
  }

  if (data.nodes.length === 0) {
    return (
      <div className="p-10 text-sm text-[var(--color-text-muted)]">
        Nothing to graph yet — pages, flashcards, and tasks will show up here as you add them.
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-49px)]">
      <div ref={containerRef} className="h-full w-full" />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-[var(--radius-base)] px-2.5 py-1.5 text-xs"
          style={{
            left: hover.x + 12,
            top: hover.y + 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <span className="uppercase text-[var(--color-text-muted)]">{hover.kind}</span> {hover.label}
        </div>
      )}
    </div>
  );
}
