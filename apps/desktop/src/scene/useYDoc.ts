import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { api } from "../api/client";
import { registerUndoSource } from "./undoRouter";

export interface SyncedTask {
  id: string;
  title: string;
  status: "todo" | "done";
  createdAt: number;
}

// Updates that came from the server merge get this origin so the local
// Y.UndoManager (which by default only tracks the local/null origin) never
// treats "a remote edit arrived" as something the user can Ctrl+Z away —
// only this user's own local edits are undoable here.
const REMOTE_ORIGIN = "sync-remote";

interface DocHandle {
  doc: Y.Doc;
  tasksMap: Y.Map<Y.Map<unknown>>;
  persistence: IndexeddbPersistence;
  undoManager: Y.UndoManager;
}

// One Y.Doc per docKey for the lifetime of the tab, not per-mount — the doc
// (and its IndexedDB persistence) IS the offline cache, so it must survive
// PlannerHtmlPanel mounting/unmounting as the camera moves in and out of
// PLANNER_FOCUS, not get thrown away and refetched every time.
const handles = new Map<string, DocHandle>();

function getHandle(docKey: string): DocHandle {
  let handle = handles.get(docKey);
  if (!handle) {
    const doc = new Y.Doc();
    const tasksMap = doc.getMap<Y.Map<unknown>>("tasks");
    const persistence = new IndexeddbPersistence(docKey, doc);
    const undoManager = new Y.UndoManager(tasksMap);
    handle = { doc, tasksMap, persistence, undoManager };
    handles.set(docKey, handle);
  }
  return handle;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function readTasks(tasksMap: Y.Map<Y.Map<unknown>>): SyncedTask[] {
  const out: SyncedTask[] = [];
  tasksMap.forEach((taskMap, id) => {
    out.push({
      id,
      title: taskMap.get("title") as string,
      status: taskMap.get("status") as "todo" | "done",
      createdAt: taskMap.get("createdAt") as number,
    });
  });
  return out.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Offline-first, CRDT-backed task list for the planner (Tier 3). Reads come
 * from a local Y.Doc persisted to IndexedDB via y-indexeddb — data is
 * available instantly on mount, before any network round-trip, and survives
 * reload even if the backend is unreachable. Writes go straight into the
 * Y.Doc (instant, local) and are pushed to PUT /sync/:docKey opportunistically
 * (on mount and on the browser's `online` event); the server does a real
 * Y.applyUpdate merge and hands back the merged state, so two devices that
 * both edited offline converge instead of one clobbering the other.
 *
 * This is scoped to the planner specifically (see Tier 3 notes) because the
 * old 2D PlannerView/ListView/CalendarView are orphaned and unreachable —
 * PlannerHtmlPanel is the only live consumer of task data, so retrofitting
 * it to CRDT doesn't risk any other currently-reachable UI.
 */
export function useSyncedTasks(userId: string) {
  const docKey = `planner-tasks-${userId}`;
  const { doc, tasksMap, undoManager } = useMemo(() => getHandle(docKey), [docKey]);
  const [tasks, setTasks] = useState<SyncedTask[]>(() => readTasks(tasksMap));
  const lastActionAtRef = useRef<number>(-Infinity);

  useEffect(() => {
    const update = () => setTasks(readTasks(tasksMap));
    tasksMap.observeDeep(update);
    update();
    return () => tasksMap.unobserveDeep(update);
  }, [tasksMap]);

  // Push-then-pull sync against the backend: push whatever we have locally
  // (covers edits made fully offline since the last successful sync), apply
  // back the server's merged state (covers edits another device made). Runs
  // on mount and again whenever the browser regains connectivity.
  useEffect(() => {
    let cancelled = false;

    async function syncNow() {
      const localUpdate = Y.encodeStateAsUpdate(doc);
      try {
        const res = await api.put<{ merged: string }>(`/sync/${docKey}`, {
          update: bytesToBase64(localUpdate),
        });
        if (cancelled) return;
        Y.applyUpdate(doc, base64ToBytes(res.merged), REMOTE_ORIGIN);
      } catch {
        // Offline or backend unreachable — IndexedDB already has the local
        // state, so the UI stays correct; we'll retry on the next `online`
        // event or the next mount.
      }
    }

    void syncNow();
    window.addEventListener("online", syncNow);
    return () => {
      cancelled = true;
      window.removeEventListener("online", syncNow);
    };
  }, [doc, docKey]);

  useEffect(() => {
    return registerUndoSource(`tasks-${docKey}`, {
      canUndo: () => undoManager.undoStack.length > 0,
      undo: () => undoManager.undo(),
      lastActionAt: () => lastActionAtRef.current,
    });
  }, [docKey, undoManager]);

  const addTask = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const id = crypto.randomUUID();
      const taskMap = new Y.Map<unknown>();
      taskMap.set("title", trimmed);
      taskMap.set("status", "todo");
      taskMap.set("createdAt", Date.now());
      doc.transact(() => {
        tasksMap.set(id, taskMap);
      });
      lastActionAtRef.current = Date.now();
    },
    [doc, tasksMap],
  );

  const toggleTask = useCallback(
    (id: string) => {
      const taskMap = tasksMap.get(id);
      if (!taskMap) return;
      doc.transact(() => {
        taskMap.set("status", taskMap.get("status") === "done" ? "todo" : "done");
      });
      lastActionAtRef.current = Date.now();
    },
    [doc, tasksMap],
  );

  return { tasks, addTask, toggleTask };
}
