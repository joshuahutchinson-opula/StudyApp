import { useEffect, useMemo, useRef, useState } from "react";
import { MICROCOPY, type TaskStatus } from "@the-desk/shared";
import { useDeadlines, useTasks, useUpdateTaskStatus } from "../planner/api";
import { useDueCards } from "../review/api";
import { useEndSession, useStartSession } from "../focus/api";

// A hand-translation of the "Medicine Desk Home v2" design (an illustrated
// desk/bookshelf scene) into real React + real data. See
// .claude/plans/humming-coalescing-karp.md for what's wired to real
// endpoints vs kept as faithful decorative fixture content, and why.

const SCENE_W = 1440;
const SCENE_H = 900;
const POMODORO_SECONDS = 25 * 60;
const RING_CIRC = 320.44;

type LampMode = "Light" | "Dark" | "Warm";
const NEXT_MODE: Record<LampMode, LampMode> = { Light: "Dark", Dark: "Warm", Warm: "Light" };

const PAL: Record<string, [string, string]> = {
  navy: ["#16303b", "#e9e2cf"],
  ink: ["#0f2027", "#d9d2c1"],
  teal: ["#2d7d8e", "#f3efe6"],
  tealdark: ["#1f5f6d", "#ebe6da"],
  slate: ["#3e4d53", "#e6e2d8"],
  stone: ["#cfc6b4", "#0f2027"],
  charcoal: ["#2a2e30", "#dcd6ca"],
};

type ShelfBook = [title: string, w: number, h: number, pal: keyof typeof PAL, n: string, meta: string];

const SHELF_DEFS: { base: number; x0: number; list: ShelfBook[] }[] = [
  {
    base: 214,
    x0: 58,
    list: [
      ["Cardiovascular", 32, 138, "navy", "03", "42 / 68 topics · edited 2 h ago"],
      ["Respiratory", 27, 128, "teal", "04", "18 / 52 topics · edited yesterday"],
      ["Renal & Urology", 30, 134, "stone", "05", "Starts Mon 5 Oct"],
      ["Neurology", 26, 124, "slate", "06", "Not started"],
      ["GI & Hepatology", 29, 132, "ink", "07", "Not started"],
      ["Endocrine", 25, 122, "tealdark", "08", "Not started"],
      ["Haematology", 27, 128, "charcoal", "09", "Not started"],
    ],
  },
  {
    base: 374,
    x0: 58,
    list: [
      ["Pharmacology", 31, 136, "teal", "P", "212 cards due"],
      ["Pathology", 28, 130, "navy", "P", "61 pages"],
      ["Anatomy", 30, 134, "stone", "A", "Practical in 10 days"],
      ["Physiology", 27, 126, "slate", "P", "88 pages"],
      ["Microbiology", 26, 128, "tealdark", "M", "34 pages"],
      ["Clinical Skills", 29, 132, "ink", "C", "OSCE in 21 days"],
      ["Case Log", 24, 118, "charcoal", "C", "14 cases"],
    ],
  },
];

interface Book {
  id: string;
  t: string;
  w: number;
  h: number;
  x: number;
  y: number;
  n: string;
  bg: string;
  fg: string;
  meta: string;
}

function buildBooks(): Book[] {
  const list: Book[] = [];
  let bi = 0;
  for (const sh of SHELF_DEFS) {
    let x = sh.x0;
    for (const [t, w, h, pal, n, meta] of sh.list) {
      const [bg, fg] = PAL[pal]!;
      list.push({ id: "book" + bi++, t, w, h, x, y: sh.base - h, n, bg, fg, meta });
      x += w + 2;
    }
  }
  return list;
}
const BOOKS = buildBooks();

interface Tick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  o: number;
  w: number;
}
function genTicks(): Tick[] {
  const out: Tick[] = [];
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    const major = i % 5 === 0;
    const r2 = major ? 58 : 61;
    out.push({
      x1: 69 + Math.sin(a) * 64,
      y1: 69 - Math.cos(a) * 64,
      x2: 69 + Math.sin(a) * r2,
      y2: 69 - Math.cos(a) * r2,
      o: major ? 0.6 : 0.22,
      w: major ? 1.4 : 0.8,
    });
  }
  return out;
}
const TICKS = genTicks();

interface Leaf {
  key: number;
  gid: string;
  bx: string;
  by: string;
  tx: string;
  ty: string;
  d: string;
  rib: string;
  fill: string;
  c0: string;
  c1: string;
  dark: string;
}
function genLeaves(): Leaf[] {
  const cx = 75;
  const cy = 86;
  const N = 44;
  const out: Leaf[] = [];
  const f = (v: number) => v.toFixed(2);
  for (let i = 0; i < N; i++) {
    const t = (i + 1) / N;
    const a = i * 2.39996323;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const L = 9 + 52 * Math.pow(t, 0.85);
    const flat = 0.28 + 0.72 * t;
    const lift = (1 - t) * 0.95 + 0.05;
    const bx = cx + ca * 3 * t;
    const by = cy + sa * 1.3 * t - (1 - t) * 3;
    const hx = ca * L * flat;
    const hy = sa * L * flat * 0.42 - L * lift * 0.85;
    const tx = bx + hx;
    const ty = by + hy;
    const w2 = L * 0.26 * (0.75 + 0.25 * t);
    const nx = -sa * w2;
    const ny = ca * 0.62 * w2;
    const p = (k: number, s: number) => `${f(bx + hx * k + nx * s)} ${f(by + hy * k + ny * s)}`;
    const d = `M${f(bx)} ${f(by)} C${p(0.18, 1.05)} ${p(0.72, 0.8)} ${f(tx)} ${f(ty)} C${p(0.72, -0.8)} ${p(0.18, -1.05)} ${f(bx)} ${f(by)}Z`;
    const tone = 0.5 + 0.5 * (-ca * 0.6 - sa * 0.45);
    out.push({
      key: sa * L * flat * 0.5 + i * 0.001,
      gid: "lf" + i,
      bx: f(bx),
      by: f(by),
      tx: f(tx),
      ty: f(ty),
      d,
      rib: `M${p(0.12, 0)} L${p(0.8, 0)}`,
      fill: `url(#lf${i})`,
      c0: t < 0.35 ? "#c3d5c9" : "#a9c1b3",
      c1: t < 0.35 ? "#a8c2b3" : "#8caa9b",
      dark: f(Math.max(0, (1 - tone) * 0.42 + (sa < 0 ? 0.06 : 0))),
    });
  }
  return out.sort((x, y) => x.key - y.key);
}
const LEAVES = genLeaves();

interface Pebble {
  x: string;
  y: string;
  r: string;
  ry: string;
  c: string;
}
function genPebbles(): Pebble[] {
  let seed = 5;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out: Pebble[] = [];
  for (let i = 0; i < 34; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    out.push({
      x: (75 + Math.cos(a) * 37 * d).toFixed(1),
      y: (89 + Math.sin(a) * 7.4 * d).toFixed(1),
      r: (1.3 + r() * 1.6).toFixed(1),
      ry: (0.9 + r() * 0.9).toFixed(1),
      c: ["#8d877e", "#b5aea3", "#6f6a63", "#cfc9bf"][Math.floor(r() * 4)]!,
    });
  }
  return out;
}
const PEBBLES = genPebbles();

const RULER_TICKS = Array.from({ length: 22 }, (_, i) => ({ y: 12 + i * 4, x2: i % 5 === 0 ? 65 : 62.5 }));
const RINGS = [75, 185, 295].map((y) => ({ y: y - 5, top: y - 19 }));

// Static/fixture content, faithful to the source — no timed-calendar-event
// data model exists yet to back a real "Tuesday" schedule.
const SCHEDULE = [
  { t: "08:00", e: "Heart failure lecture" },
  { t: "10:30", e: "Anatomy lab · thorax" },
  { t: "13:00", e: "ECG skills session" },
  { t: "15:30", e: "Focus · renal phys." },
  { t: "19:00", e: "Anki — 212 due" },
];

const GOAL_LAYOUT = [
  { left: 10, top: 14, rotate: -2, dot: "radial-gradient(circle at 35% 30%,#f4dca0,#c49445 45%,#7f5c20)" },
  { left: 52, top: 94, rotate: 1.8, dot: "radial-gradient(circle at 35% 30%,#8fd0dc,#2d7d8e 50%,#17505b)" },
  { left: 14, top: 172, rotate: -1, dot: "radial-gradient(circle at 35% 30%,#5d7a88,#16303b 50%,#07131a)" },
];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function useFitScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const s = Math.min(r.width / SCENE_W, r.height / SCENE_H);
      setScale(s > 0 && isFinite(s) ? Math.round(s * 1000) / 1000 : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [ref]);
  return scale;
}

export function MedicineHome({
  userId,
  onOpenBinder,
  onOpenReview,
}: {
  userId: string;
  onOpenBinder: () => void;
  onOpenReview: () => void;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(outerRef);

  const [hover, setHover] = useState<string | null>(null);
  const [mode, setMode] = useState<LampMode>("Warm");

  const { data: tasksData } = useTasks(userId, "medicine");
  const updateTaskStatus = useUpdateTaskStatus(userId, "medicine");
  const { data: deadlinesData } = useDeadlines(userId);
  const { data: dueCards } = useDueCards(userId, "medicine");
  const startSession = useStartSession(userId);
  const endSession = useEndSession(userId);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const runningTimer = sessionId !== null;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!runningTimer) return;
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runningTimer]);

  function finishSession(sid: string, seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    endSession.mutate({ sessionId: sid, focusMinutes: Math.max(1, Math.round(seconds / 60)) });
    setSessionId(null);
    setElapsed(0);
  }

  useEffect(() => {
    if (runningTimer && sessionId && elapsed >= POMODORO_SECONDS) finishSession(sessionId, elapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, runningTimer, sessionId]);

  function toggleTimer() {
    if (sessionId) finishSession(sessionId, elapsed);
    else startSession.mutate("pomodoro", { onSuccess: (s) => setSessionId(s.id) });
  }

  function toggleTask(taskId: string, status: TaskStatus) {
    updateTaskStatus.mutate({ taskId, status: status === "done" ? "todo" : "done" });
  }

  // First 5 tasks, whatever their status — the design's checklist shows a
  // mix of done/not-done with strikethrough, not a shrinking "today" list.
  const todayTasks = useMemo(() => (tasksData ?? []).slice(0, 5), [tasksData]);
  const leftCount = todayTasks.filter((t) => t.status !== "done").length;

  const goalCards = useMemo(() => {
    const now = Date.now();
    return (deadlinesData ?? [])
      .map((d) => ({ title: d.title, dueAt: new Date(d.dueAt as unknown as string) }))
      .filter((d) => d.dueAt.getTime() > now)
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .slice(0, 3)
      .map((d) => ({
        title: d.title,
        days: Math.max(0, Math.ceil((d.dueAt.getTime() - now) / 86400000)),
        dateLabel: d.dueAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
      }));
  }, [deadlinesData]);

  const dueCount = dueCards?.length ?? 0;
  const cardFront = dueCount > 0 ? dueCards![0]!.front : MICROCOPY.medicine.allCaughtUp;

  const isLight = mode === "Light";
  const isDark = mode === "Dark";
  const isWarm = mode === "Warm";
  const bulbMid = isDark ? "#e6eeff" : "#ffd79a";
  const bulbEdge = isDark ? "#b9c8e6" : "#f2a95a";

  const cycleMode = () => setMode((m) => NEXT_MODE[m]);

  const TIPS = useMemo(() => {
    const map: Record<string, { x: number; y: number; t: string; s: string }> = {
      lamp: { x: 300, y: 398, t: `Lamp · ${mode}`, s: `Click for ${NEXT_MODE[mode]}` },
      planner: { x: 760, y: 600, t: "Planner · Today", s: `${leftCount} of ${todayTasks.length} tasks left` },
      cards: {
        x: 270,
        y: 728,
        t: "Flashcards",
        s: dueCount > 0 ? `${dueCount} due · Pharmacology` : MICROCOPY.medicine.allCaughtUp,
      },
      timer: { x: 1290, y: 536, t: "Focus timer", s: runningTimer ? "Click to pause" : "Click to resume" },
      board: { x: 690, y: 104, t: "Whiteboard", s: "Chest pain — differential" },
      goals: { x: 1100, y: 120, t: "Goals", s: `${goalCards.length} countdown${goalCards.length === 1 ? "" : "s"}` },
      pens: { x: 995, y: 352, t: "Pen cup", s: "New quick note" },
      newbook: { x: 281, y: 252, t: "New notebook", s: "Add to shelf" },
    };
    for (const b of BOOKS) map[b.id] = { x: b.x + b.w / 2, y: b.y - 4, t: b.t, s: b.meta };
    return map;
  }, [mode, leftCount, todayTasks.length, dueCount, runningTimer, goalCards.length]);

  const tip = hover ? TIPS[hover] : null;
  const wallFilter = "blur(0.45px) saturate(0.93) contrast(0.95)";
  const dashOffset = (RING_CIRC * (1 - Math.max(0, POMODORO_SECONDS - elapsed) / POMODORO_SECONDS)).toFixed(2);
  const remaining = Math.max(0, POMODORO_SECONDS - elapsed);

  return (
    <div
      ref={outerRef}
      style={{ position: "relative", inset: 0, height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        style={{
          width: 1440,
          height: 900,
          position: "relative",
          flex: "none",
          overflow: "hidden",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          fontFamily: "Inter, system-ui, sans-serif",
          background: "#d8d0c4",
        }}
      >
        {/* Wall background layers */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1440,
            height: 480,
            background:
              "radial-gradient(ellipse 60% 90% at 10% 20%,rgba(255,250,242,.35),rgba(255,250,242,0) 70%)," +
              "linear-gradient(90deg,rgba(40,25,10,0) 35%,rgba(40,25,10,.16) 100%)," +
              "linear-gradient(180deg,rgba(40,25,10,.1) 0%,rgba(40,25,10,0) 30%,rgba(40,25,10,.08) 100%),#d8d0c4",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 1250,
            top: 0,
            width: 190,
            height: 560,
            clipPath: "polygon(0 0,100% 0,100% 549px,0 470px)",
            background: "linear-gradient(90deg,#bcb1a2,#b0a493 60%,#a6998a)",
          }}
        />
        <svg width={1440} height={560} viewBox="0 0 1440 560" style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "multiply", opacity: 0.5 }}>
          <filter id="wlN">
            <feTurbulence type="fractalNoise" baseFrequency={0.8} numOctaves={2} stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .2  0 0 0 .45 0" />
          </filter>
          <rect width={1440} height={560} filter="url(#wlN)" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 1234,
            top: 0,
            width: 32,
            height: 474,
            background: "linear-gradient(90deg,rgba(50,32,15,0),rgba(50,32,15,.16) 50%,rgba(50,32,15,.07) 62%,rgba(50,32,15,0))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 432,
            width: 1250,
            height: 40,
            background: "linear-gradient(180deg,rgba(30,20,10,0),rgba(30,20,10,.3))",
          }}
        />

        <div style={{ position: "absolute", left: 0, top: 0, width: 1440, height: 480, filter: wallFilter }}>
          <div style={{ position: "absolute", left: 44, top: 236, width: 340, height: 10, background: "rgba(50,30,12,.35)", filter: "blur(7px)", transform: "translate(6px,4px)" }} />
          <div style={{ position: "absolute", left: 44, top: 394, width: 340, height: 10, background: "rgba(50,30,12,.4)", filter: "blur(7px)", transform: "translate(6px,5px)" }} />

          {BOOKS.map((b) => (
            <div
              key={b.id}
              onMouseEnter={() => setHover(b.id)}
              onMouseLeave={() => setHover(null)}
              onClick={onOpenBinder}
              style={{
                position: "absolute",
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h,
                borderRadius: "2px 2px 1px 1px",
                cursor: "pointer",
                overflow: "hidden",
                background:
                  "repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0px,rgba(255,255,255,.035) 1px,rgba(255,255,255,0) 1px,rgba(255,255,255,0) 3px)," +
                  "repeating-linear-gradient(90deg,rgba(0,0,0,.07) 0px,rgba(0,0,0,.07) 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) 3px)," +
                  `linear-gradient(90deg,rgba(255,240,215,.22) 0%,rgba(255,255,255,.05) 28%,rgba(0,0,0,0) 55%,rgba(0,0,0,.32) 100%),${b.bg}`,
                boxShadow: "4px 0 5px rgba(40,24,10,.3),inset 0 1px 0 rgba(255,255,255,.14)",
              }}
            >
              <div style={{ position: "absolute", left: 0, right: 0, top: 8, height: 1, background: b.fg, opacity: 0.4 }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 11, height: 1, background: b.fg, opacity: 0.4 }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 19, bottom: 30, display: "flex", justifyContent: "center", overflow: "hidden" }}>
                <div style={{ writingMode: "vertical-rl", whiteSpace: "nowrap", font: "600 12px/1 'Source Serif 4',serif", letterSpacing: 0.3, color: b.fg }}>{b.t}</div>
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 17, textAlign: "center", font: "600 7px/1 Inter,sans-serif", letterSpacing: 0.4, color: b.fg, opacity: 0.75 }}>{b.n}</div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 11, height: 1, background: b.fg, opacity: 0.4 }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, height: 1, background: b.fg, opacity: 0.4 }} />
            </div>
          ))}

          <div
            onMouseEnter={() => setHover("newbook")}
            onMouseLeave={() => setHover(null)}
            onClick={onOpenBinder}
            style={{
              position: "absolute",
              left: 268,
              top: 256,
              width: 26,
              height: 118,
              boxSizing: "border-box",
              border: "1.5px dashed rgba(15,32,39,.4)",
              borderRadius: 2,
              display: "flex",
              justifyContent: "center",
              paddingTop: 8,
              cursor: "pointer",
              font: "500 15px/1 Inter,sans-serif",
              color: "rgba(15,32,39,.6)",
            }}
          >
            +
          </div>
          <div style={{ position: "absolute", left: 297, top: 300, width: 4, height: 74, background: "linear-gradient(90deg,#3b3f42,#1b1d1f)", boxShadow: "3px 0 4px rgba(40,24,10,.3)" }} />
          <div style={{ position: "absolute", left: 297, top: 371, width: 18, height: 3, background: "#1b1d1f" }} />
          <div style={{ position: "absolute", left: 305, top: 335, width: 72, height: 39, display: "flex", flexDirection: "column" }}>
            <div style={{ height: 13, marginLeft: 3, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,rgba(255,255,255,.12),rgba(0,0,0,.2)),#3e4d53", boxShadow: "3px 1px 3px rgba(40,24,10,.25)", font: "600 8.5px/1 'Source Serif 4',serif", color: "#e6e2d8", letterSpacing: 0.3 }}>
              Electives
            </div>
            <div style={{ height: 13, marginRight: 2, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,rgba(255,255,255,.2),rgba(0,0,0,.12)),#cfc6b4", boxShadow: "3px 1px 3px rgba(40,24,10,.25)", font: "600 8.5px/1 'Source Serif 4',serif", color: "#0f2027", letterSpacing: 0.3 }}>
              Research
            </div>
            <div style={{ height: 13, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,rgba(255,255,255,.12),rgba(0,0,0,.2)),#16303b", boxShadow: "3px 1px 3px rgba(40,24,10,.25)", font: "600 8.5px/1 'Source Serif 4',serif", color: "#e9e2cf", letterSpacing: 0.3 }}>
              Ethics & Law
            </div>
          </div>

          <div style={{ position: "absolute", left: 294, top: 134, width: 62, height: 80, boxSizing: "border-box", padding: 5, background: "linear-gradient(135deg,#3d2c20,#1d130d)", boxShadow: "4px 3px 6px rgba(50,30,12,.35),inset 1px 1px 0 rgba(255,255,255,.14)" }}>
            <div style={{ width: "100%", height: "100%", boxSizing: "border-box", padding: 6, background: "#efeae0", boxShadow: "inset 1px 1px 2px rgba(0,0,0,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ font: "500 9px/1 Inter,sans-serif", color: "rgba(15,32,39,.4)" }}>Photo</span>
            </div>
          </div>

          <div style={{ position: "absolute", left: 66, top: 212, width: 11, height: 56, clipPath: "polygon(0 0,100% 0,100% 100%,50% 86%,0 100%)", background: "repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0px,rgba(255,255,255,.07) 1px,rgba(255,255,255,0) 1px,rgba(255,255,255,0) 3px),linear-gradient(90deg,#8a6424,#dcb468 35%,#c0923f 62%,#7f5c20)" }} />

          <div style={{ position: "absolute", left: 40, top: 214, width: 344, height: 16, background: "repeating-linear-gradient(180deg,rgba(90,55,25,0) 0px,rgba(90,55,25,0) 3px,rgba(90,55,25,.12) 3px,rgba(90,55,25,.12) 4px),linear-gradient(180deg,#d2af84,#a98356)", boxShadow: "inset 1px 1px 0 rgba(255,240,215,.5),inset -1px -1px 0 rgba(0,0,0,.2)" }} />
          <div style={{ position: "absolute", left: 40, top: 230, width: 350, height: 6, clipPath: "polygon(0 0,344px 0,350px 100%,6px 100%)", background: "#6e5234" }} />
          <div style={{ position: "absolute", left: 40, top: 370, width: 348, height: 8, clipPath: "polygon(5px 0,348px 0,344px 100%,0 100%)", background: "linear-gradient(180deg,#c9a57a,#dcbb92)" }} />
          <div style={{ position: "absolute", left: 40, top: 378, width: 344, height: 16, background: "repeating-linear-gradient(180deg,rgba(90,55,25,0) 0px,rgba(90,55,25,0) 3px,rgba(90,55,25,.12) 3px,rgba(90,55,25,.12) 4px),linear-gradient(180deg,#cfab80,#a47e52)", boxShadow: "inset 1px 1px 0 rgba(255,240,215,.5),inset -1px -1px 0 rgba(0,0,0,.2)" }} />

          {/* Whiteboard: clinical-case differential illustration, static art */}
          <div
            onMouseEnter={() => setHover("board")}
            onMouseLeave={() => setHover(null)}
            style={{ position: "absolute", left: 430, top: 66, width: 520, height: 279, boxSizing: "border-box", padding: 9, borderRadius: 5, cursor: "pointer", background: "linear-gradient(160deg,#f1f1ee 0%,#c4c6c3 35%,#e6e7e4 55%,#a9aba8 100%)", boxShadow: "10px 16px 26px rgba(55,35,15,.28),2px 4px 6px rgba(55,35,15,.25),inset 1px 1px 0 rgba(255,255,255,.9),inset -1px -1px 0 rgba(0,0,0,.25)" }}
          >
            <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 2, overflow: "hidden", background: "linear-gradient(118deg,rgba(255,255,255,.75) 0%,rgba(255,255,255,0) 28%),radial-gradient(ellipse 30% 22% at 72% 70%,rgba(110,120,130,.08),rgba(110,120,130,0)),#f4f3ee", boxShadow: "inset 1px 1px 3px rgba(0,0,0,.2)" }}>
              <svg viewBox="0 0 542 282" width={502} height={261} style={{ position: "absolute", left: 0, top: 0 }}>
                <text x={20} y={30} fontFamily="'Source Serif 4',serif" fontStyle="italic" fontSize={13} fill="#5b6a70">54 M · diaphoretic, onset 2 h</text>
                <text x={522} y={30} textAnchor="end" fontFamily="Inter,sans-serif" fontSize={9.5} letterSpacing={1.4} fill="#5b6a70">WK 3 · CBL</text>
                <rect x={186} y={14} width={170} height={36} rx={4} fill="none" stroke="#0f2027" strokeWidth={1.75} />
                <text x={271} y={37} textAnchor="middle" fontFamily="'Source Serif 4',serif" fontWeight={600} fontSize={16.5} fill="#0f2027">Acute chest pain</text>
                <path d="M271 50 V64 M90 64 H452 M90 64 V82 M271 64 V82 M452 64 V82" fill="none" stroke="#0f2027" strokeWidth={1.5} />
                <g fontFamily="Inter,sans-serif" fontWeight={600} fontSize={11} letterSpacing={1.6} fill="#0f2027" textAnchor="middle">
                  <text x={90} y={99}>CARDIAC</text>
                  <text x={271} y={99}>PULMONARY</text>
                  <text x={452} y={99}>GI · MSK</text>
                </g>
                <g fontFamily="'Source Serif 4',serif" fontStyle="italic" fontSize={14.5} fill="#1d2b33">
                  <text x={24} y={130}>ACS — STEMI / NSTEMI<tspan fill="#b8413a"> *</tspan></text>
                  <text x={24} y={154}>Aortic dissection<tspan fill="#b8413a"> *</tspan></text>
                  <text x={24} y={178}>Pericarditis</text>
                  <text x={205} y={130}>Pulmonary embolism<tspan fill="#b8413a"> *</tspan></text>
                  <text x={205} y={154}>Tension pneumothorax<tspan fill="#b8413a"> *</tspan></text>
                  <text x={205} y={178}>Pneumonia</text>
                  <text x={386} y={130}>Oesophageal rupture<tspan fill="#b8413a"> *</tspan></text>
                  <text x={386} y={154}>GERD</text>
                  <text x={386} y={178}>Costochondritis</text>
                </g>
                <path d="M14 126 H19 M14 150 H19 M14 174 H19 M195 126 H200 M195 150 H200 M195 174 H200 M376 126 H381 M376 150 H381 M376 174 H381" stroke="#0f2027" strokeWidth={1.2} />
                <ellipse cx={96} cy={125} rx={84} ry={14} fill="none" stroke="#b8413a" strokeWidth={1.4} transform="rotate(-1.5 96 125)" />
                <line x1={20} y1={198} x2={522} y2={198} stroke="rgba(15,32,39,.16)" strokeWidth={1} />
                <g fontFamily="'Source Serif 4',serif" fontStyle="italic" fontSize={14.5} fill="#2d7d8e">
                  <text x={24} y={224}>ECG ≤ 10 min  →  troponin 0 h / 3 h</text>
                  <text x={24} y={248}>Wells ≥ 4  →  CTPA   ·   low risk  →  D-dimer</text>
                </g>
                <text x={522} y={268} textAnchor="end" fontFamily="Inter,sans-serif" fontSize={10} letterSpacing={0.6} fill="#b8413a">* can&apos;t-miss</text>
              </svg>
            </div>
          </div>
          <div style={{ position: "absolute", left: 468, top: 344, width: 444, height: 12, borderRadius: "0 0 3px 3px", background: "linear-gradient(180deg,#eceeec 0%,#b6b9b6 45%,#8d918e 100%)", boxShadow: "6px 8px 12px rgba(55,35,15,.28),inset 0 1px 0 rgba(255,255,255,.9)" }} />
          <div style={{ position: "absolute", left: 520, top: 335, width: 70, height: 9, borderRadius: 4, background: "linear-gradient(180deg,#27414d,#0f2027)", boxShadow: "2px 2px 2px rgba(0,0,0,.3)" }}>
            <div style={{ position: "absolute", right: 0, top: 0, width: 20, height: 9, borderRadius: "0 4px 4px 0", background: "linear-gradient(180deg,#1a2e37,#07131a)" }} />
          </div>
          <div style={{ position: "absolute", left: 602, top: 335, width: 70, height: 9, borderRadius: 4, background: "linear-gradient(180deg,#46a2b3,#2d7d8e)", boxShadow: "2px 2px 2px rgba(0,0,0,.3)" }}>
            <div style={{ position: "absolute", right: 0, top: 0, width: 20, height: 9, borderRadius: "0 4px 4px 0", background: "linear-gradient(180deg,#2b7584,#1c5561)" }} />
          </div>
          <div style={{ position: "absolute", left: 800, top: 328, width: 62, height: 16, borderRadius: 2, background: "linear-gradient(180deg,#c9b59a 0 40%,#2b2f33 40%)", boxShadow: "3px 3px 3px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.4)" }} />

          {/* Goals corkboard */}
          <div
            onMouseEnter={() => setHover("goals")}
            onMouseLeave={() => setHover(null)}
            style={{ position: "absolute", left: 990, top: 104, width: 220, height: 262, boxSizing: "border-box", padding: 7, borderRadius: 3, cursor: "pointer", background: "linear-gradient(135deg,#ccaa80,#9b7449)", boxShadow: "10px 16px 24px rgba(55,35,15,.28),2px 4px 6px rgba(55,35,15,.25),inset 1px 1px 0 rgba(255,255,255,.35),inset -1px -1px 0 rgba(0,0,0,.25)" }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background:
                  "radial-gradient(circle at 30% 40%,rgba(95,58,28,.38) 0 .8px,rgba(95,58,28,0) 1.3px) 0 0/6px 7px," +
                  "radial-gradient(circle at 70% 20%,rgba(255,236,205,.28) 0 .8px,rgba(255,236,205,0) 1.3px) 0 0/9px 5px," +
                  "radial-gradient(circle at 50% 80%,rgba(80,45,20,.3) 0 1px,rgba(80,45,20,0) 1.6px) 0 0/11px 13px," +
                  "linear-gradient(135deg,#c5966a,#a8784c)",
                boxShadow: "inset 1px 1px 3px rgba(0,0,0,.4)",
              }}
            >
              {goalCards.map((g, i) => {
                const pos = GOAL_LAYOUT[i]!;
                return (
                  <div
                    key={g.title}
                    style={{
                      position: "absolute",
                      left: pos.left,
                      top: pos.top,
                      width: 144,
                      height: 66,
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      transform: `rotate(${pos.rotate}deg)`,
                      background: "linear-gradient(180deg,rgba(184,65,58,0) 0 17px,rgba(184,65,58,.45) 17px 18px,rgba(184,65,58,0) 18px),#f8f4ea",
                      boxShadow: "3px 5px 7px rgba(50,25,8,.38),1px 1px 1px rgba(50,25,8,.2)",
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 9,
                    }}
                  >
                    <div style={{ font: "600 30px/0.9 'Source Serif 4',serif", color: "#0f2027" }}>{g.days}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 1 }}>
                      <div style={{ font: "600 8.5px/1 Inter,sans-serif", letterSpacing: 1.2, color: "#0f2027", whiteSpace: "nowrap", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {g.title.toUpperCase()}
                      </div>
                      <div style={{ font: "400 10px/1.2 Inter,sans-serif", color: "#44545a", whiteSpace: "nowrap" }}>days · {g.dateLabel}</div>
                    </div>
                    <div style={{ position: "absolute", left: 66, top: -5, width: 13, height: 13, borderRadius: "50%", background: pos.dot, boxShadow: "2px 3px 3px rgba(40,20,5,.45)" }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dark desk surface. pointerEvents:none is a fix, not in the source —
            this SVG's transparent upper region (its painted polygon only
            starts at y=470) was blocking hover/click on the bookshelf and
            goals board above it, since an <svg>'s full viewport rect is
            hit-tested by default even where nothing is painted. */}
        <svg viewBox="0 0 1440 900" width={1440} height={900} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
          <defs>
            <linearGradient id="dkG" x1={0} y1={470} x2={0} y2={900} gradientUnits="userSpaceOnUse">
              <stop offset={0} stopColor="#2a2b2d" />
              <stop offset={0.4} stopColor="#232426" />
              <stop offset={1} stopColor="#1c1d1f" />
            </linearGradient>
            <linearGradient id="dkS" x1={0} y1={470} x2={0} y2={620} gradientUnits="userSpaceOnUse">
              <stop offset={0} stopColor="#ffffff" stopOpacity={0.05} />
              <stop offset={1} stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dkR" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0.35} stopColor="#000" stopOpacity={0} />
              <stop offset={1} stopColor="#000" stopOpacity={0.35} />
            </linearGradient>
            <clipPath id="dkClip">
              <polygon points="0,470 1250,470 1440,549 1440,900 0,900" />
            </clipPath>
            <filter id="dkN">
              <feTurbulence type="fractalNoise" baseFrequency={1.2} numOctaves={2} stitchTiles="stitch" />
              <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0" />
            </filter>
            <filter id="dkSoft" x="-5%" y="-50%" width="110%" height="200%">
              <feGaussianBlur stdDeviation={3} />
            </filter>
          </defs>
          <polygon points="0,470 1250,470 1440,549 1440,900 0,900" fill="url(#dkG)" />
          <g clipPath="url(#dkClip)">
            <rect x={0} y={470} width={1440} height={430} filter="url(#dkN)" />
            <rect x={0} y={470} width={1440} height={160} fill="url(#dkS)" />
            <rect x={0} y={470} width={1440} height={430} fill="url(#dkR)" />
            <path d="M0 473 H1250 L1440 552" stroke="#000" strokeOpacity={0.8} strokeWidth={8} fill="none" filter="url(#dkSoft)" />
            <path d="M0 470.6 H1250 L1440 549.6" stroke="#fff" strokeOpacity={0.09} strokeWidth={1} fill="none" />
          </g>
        </svg>

        <div style={{ position: "absolute", left: 1016, top: 528, width: 90, height: 24, borderRadius: "50%", background: "radial-gradient(ellipse at 25% 50%,rgba(0,0,0,.75),rgba(0,0,0,0) 70%)", filter: "blur(4px)" }} />
        <div style={{ position: "absolute", left: 1150, top: 494, width: 150, height: 28, borderRadius: "50%", background: "radial-gradient(ellipse at 25% 50%,rgba(0,0,0,.75),rgba(0,0,0,0) 70%)", filter: "blur(4px)" }} />
        <div style={{ position: "absolute", left: 1236, top: 720, width: 190, height: 34, borderRadius: "50%", background: "radial-gradient(ellipse at 22% 50%,rgba(0,0,0,.75),rgba(0,0,0,0) 70%)", filter: "blur(7px)" }} />
        <div style={{ position: "absolute", left: 90, top: 592, width: 150, height: 30, borderRadius: "50%", background: "radial-gradient(ellipse at 30% 50%,rgba(0,0,0,.8),rgba(0,0,0,0) 70%)", filter: "blur(5px)" }} />

        {/* Pen cup */}
        <svg
          viewBox="0 0 100 190"
          width={100}
          height={190}
          style={{ position: "absolute", left: 945, top: 352, cursor: "pointer" }}
          onMouseEnter={() => setHover("pens")}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="pcAl" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#9da2a6" /><stop offset={0.12} stopColor="#d9dde0" /><stop offset={0.26} stopColor="#f4f6f7" />
              <stop offset={0.42} stopColor="#cbcfd3" /><stop offset={0.62} stopColor="#a4a9ae" /><stop offset={0.8} stopColor="#7a7f84" />
              <stop offset={0.92} stopColor="#686d72" /><stop offset={1} stopColor="#858a8f" />
            </linearGradient>
            <pattern id="pcBr" width={3} height={10} patternUnits="userSpaceOnUse">
              <rect width={1} height={10} fill="#fff" opacity={0.08} /><rect x={2} width={1} height={10} fill="#000" opacity={0.05} />
            </pattern>
            <linearGradient id="pcAo" x1={0} y1={0} x2={0} y2={1}>
              <stop offset={0.75} stopColor="#000" stopOpacity={0} /><stop offset={1} stopColor="#000" stopOpacity={0.35} />
            </linearGradient>
            <linearGradient id="pcIn" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#1e2124" /><stop offset={0.55} stopColor="#34383c" /><stop offset={1} stopColor="#7c8186" />
            </linearGradient>
            <linearGradient id="pcRim" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#e6e9eb" /><stop offset={0.3} stopColor="#ffffff" /><stop offset={1} stopColor="#9ca1a6" />
            </linearGradient>
            <linearGradient id="pcSt" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#8e9496" /><stop offset={0.3} stopColor="#f2f4f4" /><stop offset={0.55} stopColor="#b8bdbf" /><stop offset={1} stopColor="#666c6e" />
            </linearGradient>
            <linearGradient id="pcNv" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#2c4653" /><stop offset={0.28} stopColor="#6c8a98" /><stop offset={0.45} stopColor="#1d3844" /><stop offset={1} stopColor="#06121a" />
            </linearGradient>
            <linearGradient id="pcBk" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#3a3c3e" /><stop offset={0.3} stopColor="#76797b" /><stop offset={0.48} stopColor="#2a2c2e" /><stop offset={1} stopColor="#0d0e0f" />
            </linearGradient>
            <linearGradient id="pcTl" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#3f95a6" /><stop offset={0.3} stopColor="#8fd0dc" /><stop offset={0.5} stopColor="#2d7d8e" /><stop offset={1} stopColor="#15454f" />
            </linearGradient>
            <linearGradient id="pcTd" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#1f5f6d" /><stop offset={0.3} stopColor="#4f9fb0" /><stop offset={0.5} stopColor="#1a5663" /><stop offset={1} stopColor="#0b2e36" />
            </linearGradient>
          </defs>
          <ellipse cx={50} cy={92} rx={36} ry={10} fill="url(#pcRim)" />
          <ellipse cx={50} cy={92.4} rx={33.5} ry={8.6} fill="url(#pcIn)" />
          <g transform="rotate(9 66 98)">
            <rect x={60} y={10} width={13} height={92} fill="url(#pcSt)" />
            {RULER_TICKS.map((rt, i) => (
              <line key={i} x1={60} y1={rt.y} x2={rt.x2} y2={rt.y} stroke="#2a2e30" strokeWidth={0.6} />
            ))}
            <text x={70} y={22} fontFamily="Inter,sans-serif" fontSize={4} fill="#2a2e30" transform="rotate(90 70 22)">15 cm</text>
          </g>
          <g transform="rotate(7 55 98)">
            <rect x={51} y={24} width={7} height={78} rx={1} fill="url(#pcBk)" />
            <rect x={51} y={20} width={7} height={8} rx={1} fill="url(#pcSt)" />
            <rect x={53.4} y={15} width={2.2} height={5.5} fill="url(#pcSt)" />
            <rect x={57.4} y={28} width={1.8} height={22} rx={0.9} fill="url(#pcSt)" />
          </g>
          <g transform="rotate(-3 45 98)">
            <rect x={40} y={8} width={10} height={94} rx={3.5} fill="url(#pcNv)" />
            <rect x={40} y={44} width={10} height={3} fill="url(#pcSt)" />
            <ellipse cx={45} cy={8.6} rx={4.6} ry={1.6} fill="url(#pcSt)" />
            <rect x={48.2} y={11} width={2.4} height={28} rx={1.2} fill="url(#pcSt)" />
            <circle cx={49.4} cy={38} r={1.7} fill="url(#pcSt)" />
          </g>
          <g transform="rotate(-8 32 98)">
            <rect x={28} y={18} width={7.5} height={84} rx={1.5} fill="url(#pcSt)" />
            <rect x={28} y={44} width={7.5} height={3} fill="url(#pcTl)" />
            <ellipse cx={31.75} cy={18.4} rx={3.75} ry={1.3} fill="#dfe9ec" />
            <rect x={34} y={22} width={1.8} height={20} rx={0.9} fill="#6e7476" />
          </g>
          <g transform="rotate(-15 26 98)">
            <rect x={19} y={40} width={13} height={62} rx={2} fill="url(#pcTl)" />
            <rect x={18.5} y={30} width={14} height={24} rx={2.5} fill="url(#pcTd)" />
            <rect x={23.5} y={32} width={4} height={18} rx={1} fill="#0b2e36" opacity={0.45} />
          </g>
          <ellipse cx={50} cy={96} rx={30} ry={5} fill="#000" opacity={0.35} />
          <path d="M14 92 A36 10 0 0 0 86 92 L86 176 A36 10 0 0 1 14 176 Z" fill="url(#pcAl)" />
          <path d="M14 92 A36 10 0 0 0 86 92 L86 176 A36 10 0 0 1 14 176 Z" fill="url(#pcBr)" />
          <path d="M14 92 A36 10 0 0 0 86 92 L86 176 A36 10 0 0 1 14 176 Z" fill="url(#pcAo)" />
          <path d="M14 92 A36 10 0 0 0 86 92 L83.5 92 A33.5 8.6 0 0 1 16.5 92 Z" fill="url(#pcRim)" />
          <path d="M14 92 A36 10 0 0 0 86 92" fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={0.8} />
        </svg>

        {/* Plant */}
        <svg viewBox="0 0 150 145" width={220} height={213} style={{ position: "absolute", left: 1065, top: 306, cursor: "default" }}>
          <defs>
            <linearGradient id="plPot" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#c9c3b9" /><stop offset={0.2} stopColor="#ece8e1" /><stop offset={0.48} stopColor="#dcd6cc" />
              <stop offset={0.8} stopColor="#a69e92" /><stop offset={0.92} stopColor="#958d81" /><stop offset={1} stopColor="#aba397" />
            </linearGradient>
            <pattern id="plSp" width={7} height={6} patternUnits="userSpaceOnUse">
              <circle cx={1.5} cy={1.5} r={0.45} fill="#6f675c" opacity={0.5} />
              <circle cx={5} cy={4.2} r={0.35} fill="#6f675c" opacity={0.4} />
            </pattern>
            <linearGradient id="plAo" x1={0} y1={0} x2={0} y2={1}>
              <stop offset={0} stopColor="#000" stopOpacity={0.22} /><stop offset={0.18} stopColor="#000" stopOpacity={0} />
              <stop offset={0.8} stopColor="#000" stopOpacity={0} /><stop offset={1} stopColor="#000" stopOpacity={0.3} />
            </linearGradient>
            <radialGradient id="plSoil" cx={0.45} cy={0.45} r={0.6}>
              <stop offset={0} stopColor="#4a3d33" /><stop offset={1} stopColor="#241c16" />
            </radialGradient>
            {LEAVES.map((lf) => (
              <linearGradient key={lf.gid} id={lf.gid} gradientUnits="userSpaceOnUse" x1={lf.bx} y1={lf.by} x2={lf.tx} y2={lf.ty}>
                <stop offset={0} stopColor={lf.c0} /><stop offset={0.62} stopColor={lf.c1} />
                <stop offset={0.9} stopColor="#b98d8e" /><stop offset={1} stopColor="#a4706f" />
              </linearGradient>
            ))}
          </defs>
          <path d="M31 88 A44 10 0 0 0 119 88 L115 130 A40 9 0 0 1 35 130 Z" fill="url(#plPot)" />
          <path d="M31 88 A44 10 0 0 0 119 88 L115 130 A40 9 0 0 1 35 130 Z" fill="url(#plSp)" />
          <path d="M31 88 A44 10 0 0 0 119 88 L115 130 A40 9 0 0 1 35 130 Z" fill="url(#plAo)" />
          <ellipse cx={75} cy={88} rx={44} ry={10} fill="#efebe4" />
          <ellipse cx={75} cy={88.6} rx={40.5} ry={8.4} fill="url(#plSoil)" />
          {PEBBLES.map((pb, i) => (
            <ellipse key={i} cx={pb.x} cy={pb.y} rx={pb.r} ry={pb.ry} fill={pb.c} />
          ))}
          {LEAVES.map((lf) => (
            <g key={lf.gid}>
              <path d={lf.d} fill={lf.fill} stroke="#5d6f66" strokeOpacity={0.35} strokeWidth={0.5} />
              <path d={lf.d} fill="#0c1a14" fillOpacity={lf.dark} />
              <path d={lf.rib} stroke="#ffffff" strokeOpacity={0.22} strokeWidth={0.7} fill="none" />
            </g>
          ))}
        </svg>

        {/* Lamp */}
        <svg viewBox="30 360 340 260" width={340} height={260} style={{ position: "absolute", left: 30, top: 360 }}>
          <defs>
            <linearGradient id="lpN" x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor="#3c5866" /><stop offset={0.35} stopColor="#1f3a46" /><stop offset={1} stopColor="#0a161c" />
            </linearGradient>
            <linearGradient id="lpTop" x1={0} y1={0} x2={1} y2={1}>
              <stop offset={0} stopColor="#3d5a68" /><stop offset={0.6} stopColor="#16303b" /><stop offset={1} stopColor="#0c1a20" />
            </linearGradient>
            <linearGradient id="lpSt" x1={0} y1={0} x2={1} y2={1}>
              <stop offset={0} stopColor="#f2f4f4" /><stop offset={0.5} stopColor="#a9afb1" /><stop offset={1} stopColor="#5f6567" />
            </linearGradient>
            <radialGradient id="lpIn" cx={0.5} cy={0.4} r={0.6}>
              <stop offset={0} stopColor="#2b3a40" /><stop offset={1} stopColor="#070d10" />
            </radialGradient>
          </defs>
          <g onClick={cycleMode} onMouseEnter={() => setHover("lamp")} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
            <path d="M55 594 L55 603 A50 12 0 0 0 155 603 L155 594 Z" fill="url(#lpN)" />
            <ellipse cx={105} cy={594} rx={50} ry={12} fill="url(#lpTop)" />
            <ellipse cx={100} cy={591} rx={34} ry={6} fill="#ffffff" opacity={0.06} />
            <ellipse cx={136} cy={594} rx={6} ry={2.4} fill="url(#lpSt)" />
            <line x1={105} y1={590} x2={128} y2={434} stroke="url(#lpN)" strokeWidth={7.5} strokeLinecap="round" />
            <line x1={102.6} y1={588} x2={125.4} y2={435} stroke="#ffffff" strokeOpacity={0.22} strokeWidth={1.4} />
            <circle cx={105} cy={588} r={6.5} fill="url(#lpSt)" /><circle cx={105} cy={588} r={2.2} fill="#2b3134" />
            <line x1={128} y1={432} x2={268} y2={410} stroke="url(#lpN)" strokeWidth={6.5} strokeLinecap="round" />
            <line x1={129} y1={429.4} x2={267} y2={407.6} stroke="#ffffff" strokeOpacity={0.22} strokeWidth={1.2} />
            <circle cx={128} cy={432} r={7.5} fill="url(#lpSt)" /><circle cx={128} cy={432} r={2.6} fill="#2b3134" />
            <g transform="translate(274 414) rotate(-24)">
              <rect x={-7} y={-6} width={14} height={14} rx={2} fill="url(#lpN)" />
              <path d="M-13 6 L13 6 L44 64 L-44 64 Z" fill="url(#lpN)" />
              <path d="M-13 6 L-6 6 L-26 64 L-44 64 Z" fill="#ffffff" opacity={0.08} />
              <ellipse cx={0} cy={64} rx={44} ry={11} fill="url(#lpSt)" />
              <ellipse cx={0} cy={64} rx={42} ry={9.6} fill="url(#lpIn)" />
            </g>
            <circle cx={268} cy={410} r={6} fill="url(#lpSt)" /><circle cx={268} cy={410} r={2.2} fill="#2b3134" />
          </g>
        </svg>

        {/* Perspective flashcard + planner */}
        <div style={{ position: "absolute", inset: 0, perspective: 620, perspectiveOrigin: "720px 637px", pointerEvents: "none" }}>
          <div
            onMouseEnter={() => setHover("cards")}
            onMouseLeave={() => setHover(null)}
            onClick={onOpenReview}
            style={{ position: "absolute", left: 145, top: 707, width: 250, height: 165, transform: "rotateX(58deg) rotateZ(7deg)", pointerEvents: "auto", cursor: "pointer" }}
          >
            <div style={{ position: "absolute", inset: 0, borderRadius: 3, background: "#e9e1cf", transform: "rotate(-6deg)", boxShadow: "16px -4px 18px rgba(0,0,0,.6)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 3, background: "#f0e9da", transform: "rotate(3deg)", boxShadow: "1px 1px 0 #d6cdb8,2px 2px 0 #cfc5ae,4px 3px 6px rgba(0,0,0,.35)" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                boxSizing: "border-box",
                padding: "14px 18px",
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                background: "linear-gradient(180deg,rgba(184,65,58,0) 0 40px,rgba(184,65,58,.45) 40px 41px,rgba(184,65,58,0) 41px),#faf7ef",
                boxShadow: "1px 1px 0 #e1d9c6,2px 2px 0 #d6cdb8,3px 3px 5px rgba(0,0,0,.4)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ font: "600 11px/1 Inter,sans-serif", letterSpacing: 1.6, color: "#2d7d8e" }}>Q · PHARMACOLOGY</span>
                <span style={{ font: "500 11px/1 Inter,sans-serif", color: "#44545a" }}>{dueCount} due</span>
              </div>
              <div style={{ font: "italic 500 24px/1.22 'Source Serif 4',serif", color: "#1d2b33", textWrap: "pretty" } as React.CSSProperties}>{cardFront}</div>
            </div>
          </div>

          <div
            onMouseEnter={() => setHover("planner")}
            onMouseLeave={() => setHover(null)}
            style={{ position: "absolute", left: 480, top: 515, width: 560, height: 370, transform: "rotateX(58deg) rotateZ(-2deg)", transformStyle: "preserve-3d", pointerEvents: "auto" }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 8,
                background:
                  "repeating-linear-gradient(35deg,rgba(255,255,255,.015) 0px,rgba(255,255,255,.015) 1px,rgba(255,255,255,0) 1px,rgba(255,255,255,0) 4px)," +
                  "linear-gradient(135deg,#1f3b48,#12262f 60%,#0b181e)",
                boxShadow: "24px -6px 30px rgba(0,0,0,.65),4px 0 6px rgba(0,0,0,.5),inset 1px 1px 0 rgba(255,255,255,.12)",
              }}
            />
            <div style={{ position: "absolute", inset: 5, borderRadius: 5, border: "1px dashed rgba(232,222,200,.22)" }} />
            <div style={{ position: "absolute", left: 12, top: 10, width: 264, height: 350, borderRadius: "3px 0 0 3px", overflow: "hidden", background: "linear-gradient(90deg,rgba(80,60,30,0) 78%,rgba(80,60,30,.2) 100%),#f6f1e5", boxShadow: "0 1px 0 #e3dccb,0 2px 0 #d8d0bd,-1px 0 0 #e3dccb" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 96, bottom: 22, background: "repeating-linear-gradient(180deg,rgba(45,125,142,0) 0px,rgba(45,125,142,0) 31px,rgba(45,125,142,.26) 31px,rgba(45,125,142,.26) 32px)" }} />
              <div style={{ position: "absolute", left: 30, top: 0, bottom: 0, width: 1, background: "rgba(184,65,58,.3)" }} />
              <div style={{ position: "absolute", left: 38, top: 24, right: 14, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ font: "600 30px/1 'Source Serif 4',serif", color: "#0f2027" }}>Tuesday</div>
                <div style={{ font: "600 11.5px/1 Inter,sans-serif", letterSpacing: 1.6, color: "#2d7d8e" }}>22 SEPTEMBER · WK 38</div>
              </div>
              <div style={{ position: "absolute", left: 38, right: 10, top: 96, display: "flex", flexDirection: "column" }}>
                {SCHEDULE.map((r, i) => (
                  <div key={i} style={{ height: 32, boxSizing: "border-box", paddingBottom: 6, display: "flex", alignItems: "flex-end", gap: 9, whiteSpace: "nowrap" }}>
                    <span style={{ width: 38, flex: "none", font: "600 11.5px/1 Inter,sans-serif", color: "#2d7d8e", fontVariantNumeric: "tabular-nums" }}>{r.t}</span>
                    <span style={{ font: "italic 500 17.5px/1 'Source Serif 4',serif", color: "#1d2b33" }}>{r.e}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: "absolute", left: 284, top: 10, width: 264, height: 350, borderRadius: "0 3px 3px 0", overflow: "hidden", background: "linear-gradient(270deg,rgba(80,60,30,0) 80%,rgba(80,60,30,.2) 100%),#f7f2e7", boxShadow: "0 1px 0 #e3dccb,0 2px 0 #d8d0bd,1px 0 0 #e3dccb" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 96, bottom: 22, background: "repeating-linear-gradient(180deg,rgba(45,125,142,0) 0px,rgba(45,125,142,0) 31px,rgba(45,125,142,.26) 31px,rgba(45,125,142,.26) 32px)" }} />
              <div style={{ position: "absolute", left: 30, top: 24, right: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ font: "600 30px/1 'Source Serif 4',serif", color: "#0f2027" }}>Today</div>
                <div style={{ font: "600 11.5px/1 Inter,sans-serif", color: "#44545a", paddingBottom: 4 }}>{leftCount} of {todayTasks.length} left</div>
              </div>
              <div style={{ position: "absolute", left: 30, right: 10, top: 96, display: "flex", flexDirection: "column" }}>
                {todayTasks.map((k) => {
                  const done = k.status === "done";
                  return (
                    <div
                      key={k.id}
                      onClick={() => toggleTask(k.id, k.status)}
                      style={{ height: 32, boxSizing: "border-box", paddingBottom: 5, display: "flex", alignItems: "flex-end", gap: 10, whiteSpace: "nowrap", cursor: "pointer" }}
                    >
                      <div style={{ width: 15, height: 15, flex: "none", boxSizing: "border-box", borderRadius: 3, border: "1.75px solid #16303b", background: done ? "#2d7d8e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 1 }}>
                        {done && <div style={{ width: 4, height: 8, borderRight: "2px solid #f6f1e5", borderBottom: "2px solid #f6f1e5", transform: "translateY(-1px) rotate(45deg)" }} />}
                      </div>
                      <span style={{ font: "italic 500 17.5px/1 'Source Serif 4',serif", color: "#1d2b33", textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }}>{k.title}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ position: "absolute", left: 30, right: 10, top: 290, font: "italic 500 15px/1 'Source Serif 4',serif", color: "#2d7d8e", whiteSpace: "nowrap" }}>→ ask Dr. Osei re: troponin</div>
            </div>
            <div style={{ position: "absolute", left: 272, top: 10, width: 16, height: 350, background: "linear-gradient(90deg,rgba(40,25,10,.28),rgba(40,25,10,0) 45%,rgba(40,25,10,0) 55%,rgba(40,25,10,.28))" }} />
            <div style={{ position: "absolute", left: 272, top: 34, width: 16, height: 302, borderRadius: 8, background: "linear-gradient(90deg,#747a79,#e8ebea 40%,#b3b8b7 65%,#6f7574)", boxShadow: "3px 0 4px rgba(0,0,0,.3)" }} />
            {RINGS.map((rg, i) => (
              <div key={i}>
                <div style={{ position: "absolute", left: 258, top: rg.y, width: 11, height: 11, borderRadius: "50%", background: "#0c1a21", boxShadow: "inset 1px 1px 2px rgba(0,0,0,.8)" }} />
                <div style={{ position: "absolute", left: 291, top: rg.y, width: 11, height: 11, borderRadius: "50%", background: "#0c1a21", boxShadow: "inset 1px 1px 2px rgba(0,0,0,.8)" }} />
                <div style={{ position: "absolute", left: 261, top: rg.top, width: 38, height: 19, boxSizing: "border-box", border: "3px solid #c3c8c7", borderBottom: 0, borderRadius: "19px 19px 0 0", transformOrigin: "50% 100%", transform: "rotateX(-90deg)", boxShadow: "inset 1px 1px 0 rgba(255,255,255,.6)" }} />
              </div>
            ))}
            <div style={{ position: "absolute", left: 6, right: 6, top: "100%", height: 9, transformOrigin: "50% 0", transform: "rotateX(-90deg)", background: "repeating-linear-gradient(180deg,#ece5d3 0px,#ece5d3 1px,#d9d1bd 1px,#d9d1bd 2px),#ece5d3", boxShadow: "inset 0 -3px 0 #0e1e26" }} />
          </div>
        </div>

        {/* Focus timer */}
        <div
          onClick={toggleTimer}
          onMouseEnter={() => setHover("timer")}
          onMouseLeave={() => setHover(null)}
          style={{ position: "absolute", left: 1212, top: 552, width: 156, height: 190, cursor: "pointer" }}
        >
          <div style={{ position: "absolute", left: 28, top: 136, width: 100, height: 52, clipPath: "polygon(12% 0,88% 0,100% 100%,0 100%)", background: "linear-gradient(180deg,#3a3c3f 0 22%,#1e1f21 22%,#111213 100%)" }} />
          <div style={{ position: "absolute", left: 69, top: -10, width: 18, height: 10, borderRadius: "2px 2px 0 0", background: "linear-gradient(90deg,#8e9493,#eef0ef 40%,#7a807f)" }} />
          <div style={{ position: "absolute", left: 0, top: -7, width: 156, height: 156, borderRadius: "50%", background: "linear-gradient(180deg,#eceeed,#8b9190)" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 156, height: 156, borderRadius: "50%", background: "conic-gradient(from 200deg,#dfe2e1,#8e9493,#eceeed,#7d8382,#d3d6d5,#9aa09f,#dfe2e1)", boxShadow: "14px 10px 22px rgba(0,0,0,.6),3px 3px 5px rgba(0,0,0,.5),inset 1px 1px 1px rgba(255,255,255,.85),inset -1px -1px 2px rgba(0,0,0,.4)" }} />
          <div style={{ position: "absolute", left: 9, top: 9, width: 138, height: 138, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#1f3d4a,#0f2027 60%,#08141a)", boxShadow: "inset 2px 3px 7px rgba(0,0,0,.75),inset -1px -1px 0 rgba(255,255,255,.07)" }} />
        </div>

        {isLight && (
          <>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", background: "linear-gradient(90deg,#ffffff 0%,#f6f3ee 55%,#e4dfd8 100%)" }} />
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen", background: "radial-gradient(ellipse 60% 70% at 8% 18%,rgba(228,238,246,.22),rgba(228,238,246,0) 70%)" }} />
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 90% 90% at 40% 42%,rgba(0,0,0,0) 62%,rgba(0,0,0,.22) 100%)" }} />
          </>
        )}
        {isWarm && (
          <>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", background: "radial-gradient(ellipse 58% 64% at 30% 70%,#fff4e2 0%,#e2c9a8 38%,#96785a 72%,#5e4a38 100%)" }} />
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen", background: "radial-gradient(ellipse 420px 190px at 430px 690px,rgba(255,196,130,.22),rgba(255,196,130,0) 100%)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 900, pointerEvents: "none", mixBlendMode: "screen", filter: "blur(8px)", clipPath: "polygon(262px 490px,338px 455px,660px 650px,250px 860px)", background: "linear-gradient(156deg,rgba(255,206,140,.16),rgba(255,206,140,0) 80%)" }} />
          </>
        )}
        {isDark && (
          <>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", background: "radial-gradient(ellipse 54% 60% at 31% 71%,#f6f8fb 0%,#b0b6c0 36%,#646a76 70%,#474c57 100%)" }} />
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen", background: "radial-gradient(ellipse 400px 180px at 430px 690px,rgba(220,232,255,.16),rgba(220,232,255,0) 100%)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 900, pointerEvents: "none", mixBlendMode: "screen", filter: "blur(8px)", clipPath: "polygon(262px 490px,338px 455px,660px 650px,250px 860px)", background: "linear-gradient(156deg,rgba(225,235,255,.13),rgba(225,235,255,0) 80%)" }} />
          </>
        )}

        {!isLight && (
          <svg viewBox="30 360 340 260" width={340} height={260} style={{ position: "absolute", left: 30, top: 360, pointerEvents: "none" }}>
            <defs>
              <radialGradient id="emB" cx={0.5} cy={0.5} r={0.5}>
                <stop offset={0} stopColor="#ffffff" /><stop offset={0.55} stopColor={bulbMid} /><stop offset={1} stopColor={bulbEdge} />
              </radialGradient>
              <radialGradient id="emH" cx={0.5} cy={0.5} r={0.5}>
                <stop offset={0} stopColor={bulbMid} stopOpacity={0.55} /><stop offset={1} stopColor={bulbMid} stopOpacity={0} />
              </radialGradient>
              <filter id="emBl" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={6} />
              </filter>
            </defs>
            <g transform="translate(274 414) rotate(-24)">
              <ellipse cx={0} cy={70} rx={72} ry={26} fill="url(#emH)" filter="url(#emBl)" />
              <ellipse cx={0} cy={64} rx={42} ry={9.6} fill="url(#emB)" />
            </g>
          </svg>
        )}

        <svg viewBox="0 0 138 138" width={138} height={138} style={{ position: "absolute", left: 1221, top: 561, pointerEvents: "none" }}>
          {TICKS.map((tk, i) => (
            <line key={i} x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2} stroke="#e9efec" strokeOpacity={tk.o} strokeWidth={tk.w} />
          ))}
          <circle cx={69} cy={69} r={51} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={5} />
          <circle cx={69} cy={69} r={51} fill="none" stroke="#3fa3b5" strokeWidth={5} strokeLinecap="round" strokeDasharray={320.44} strokeDashoffset={dashOffset} transform="rotate(-90 69 69)" />
        </svg>
        <div style={{ position: "absolute", left: 1221, top: 561, width: 138, height: 138, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <div style={{ font: "600 7.5px/1 Inter,sans-serif", letterSpacing: 1.4, color: "#86bcc7" }}>CARDIO QBANK</div>
          <div style={{ font: "500 30px/1 Inter,sans-serif", letterSpacing: -0.5, color: "#eef2ef", fontVariantNumeric: "tabular-nums" }}>{formatTime(remaining)}</div>
          <div style={{ font: "600 7.5px/1 Inter,sans-serif", letterSpacing: 1.4, color: "#9fb0b4" }}>{runningTimer ? "FOCUS" : "PAUSED"}</div>
        </div>
        <div style={{ position: "absolute", left: 1221, top: 561, width: 138, height: 138, borderRadius: "50%", pointerEvents: "none", background: "linear-gradient(160deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,.04) 38%,rgba(255,255,255,0) 40%)" }} />

        {tip && (
          <div style={{ position: "absolute", left: tip.x, top: tip.y, transform: "translate(-50%,-100%)", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ background: "#0f2027", color: "#f3efe6", padding: "7px 11px", borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,.3)", display: "flex", flexDirection: "column", gap: 3, whiteSpace: "nowrap" }}>
              <div style={{ font: "600 12px/1.1 Inter,sans-serif" }}>{tip.t}</div>
              <div style={{ font: "400 11px/1.1 Inter,sans-serif", color: "#b9c6c9" }}>{tip.s}</div>
            </div>
            <div style={{ width: 8, height: 8, background: "#0f2027", transform: "translateY(-4px) rotate(45deg)" }} />
          </div>
        )}
      </div>
    </div>
  );
}
