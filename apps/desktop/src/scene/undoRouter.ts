// Tier 3's "universal undo" seam. This is deliberately NOT a general
// cross-domain undo log — it's a pragmatic router that lets one Ctrl+Z-ish
// entry point dispatch to whichever domain (camera navigation, task edits,
// ...) most recently did something undoable, by comparing timestamps each
// domain reports for itself. Two domains never see each other's history;
// this just picks which domain's OWN undo() to call.
interface UndoSource {
  canUndo: () => boolean;
  undo: () => void;
  lastActionAt: () => number;
}

const sources = new Map<string, UndoSource>();

export function registerUndoSource(key: string, source: UndoSource): () => void {
  sources.set(key, source);
  return () => {
    if (sources.get(key) === source) sources.delete(key);
  };
}

export function globalUndo(): void {
  let best: UndoSource | null = null;
  let bestTime = -Infinity;
  for (const source of sources.values()) {
    if (!source.canUndo()) continue;
    const t = source.lastActionAt();
    if (t > bestTime) {
      bestTime = t;
      best = source;
    }
  }
  best?.undo();
}
