import { useEffect, useMemo } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { createTLStore, defaultShapeUtils, defaultBindingUtils, type TLStore, type TLRecord } from "tldraw";
import { api } from "../api/client";

// Same remote-vs-local origin convention as useYDoc.ts: writes that came
// from applying a server merge are tagged so they don't get mirrored right
// back into the Yjs doc as if they were a fresh local edit (which would be
// harmless-but-wasteful at best, an infinite echo at worst).
const REMOTE_ORIGIN = "sync-remote";

interface WhiteboardHandle {
  doc: Y.Doc;
  recordsMap: Y.Map<string>;
  tlStore: TLStore;
}

// One Y.Doc + tldraw TLStore per docKey for the tab's lifetime — mirrors
// useYDoc.ts's handle cache, for the same reason: this IS the offline cache
// and must survive WhiteboardOverlay unmounting when the user leaves and
// returns to the whiteboard.
const handles = new Map<string, WhiteboardHandle>();

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

function getHandle(docKey: string): WhiteboardHandle {
  const existing = handles.get(docKey);
  if (existing) return existing;

  const doc = new Y.Doc();
  const recordsMap = doc.getMap<string>("records");
  const persistence = new IndexeddbPersistence(docKey, doc);
  const tlStore = createTLStore({ shapeUtils: defaultShapeUtils, bindingUtils: defaultBindingUtils });

  function applyAllFromYjs() {
    const records: TLRecord[] = [];
    recordsMap.forEach((json) => {
      try {
        records.push(JSON.parse(json) as TLRecord);
      } catch {
        // Ignore a corrupt entry rather than taking down the whole board.
      }
    });
    if (records.length > 0) {
      tlStore.mergeRemoteChanges(() => {
        tlStore.put(records);
      });
    }
  }
  void persistence.whenSynced.then(applyAllFromYjs);

  // Local edits (source "user") mirror into the Yjs map, one key per record
  // — so two people editing DIFFERENT shapes at once merge with zero
  // conflict. Concurrent edits to the SAME shape resolve by Yjs's normal
  // last-write-wins-per-key rule; this is record-level CRDT merge, not
  // field-level operational transform on individual shape properties, which
  // is the right tradeoff for a whiteboard's grain of collaboration.
  tlStore.listen(
    ({ changes }) => {
      doc.transact(() => {
        for (const record of Object.values(changes.added)) recordsMap.set(record.id, JSON.stringify(record));
        for (const [, to] of Object.values(changes.updated)) recordsMap.set(to.id, JSON.stringify(to));
        for (const record of Object.values(changes.removed)) recordsMap.delete(record.id);
      });
    },
    { source: "user", scope: "document" },
  );

  // Remote changes (arrived via a server merge, tagged REMOTE_ORIGIN below)
  // get applied back into the tldraw store through mergeRemoteChanges, which
  // is what keeps this from re-triggering the "user" listener above and
  // looping forever.
  recordsMap.observe((event) => {
    if (event.transaction.origin !== REMOTE_ORIGIN) return;
    const toPut: TLRecord[] = [];
    const toRemove: TLRecord["id"][] = [];
    event.changes.keys.forEach((change, key) => {
      if (change.action === "delete") {
        toRemove.push(key as TLRecord["id"]);
        return;
      }
      const json = recordsMap.get(key);
      if (json) {
        try {
          toPut.push(JSON.parse(json) as TLRecord);
        } catch {
          // Skip a corrupt entry.
        }
      }
    });
    tlStore.mergeRemoteChanges(() => {
      if (toPut.length > 0) tlStore.put(toPut);
      if (toRemove.length > 0) tlStore.remove(toRemove);
    });
  });

  const handle: WhiteboardHandle = { doc, recordsMap, tlStore };
  handles.set(docKey, handle);
  return handle;
}

/**
 * Tier 6's multiplayer whiteboard, built directly on Tier 3's sync layer
 * (same Y.Doc + y-indexeddb + PUT /sync/:docKey CRDT-merge pattern used for
 * planner tasks) rather than a separate real-time system. There's no
 * WebSocket relay in this stack, so convergence between two people editing
 * the same board is poll-based (every `pollMs`, default 4s) rather than
 * instant push — a deliberate, bounded scope decision, not an oversight:
 * building a WebSocket server safely was out of scope for this pass, and
 * polling on the existing REST endpoint gets genuine multi-person
 * convergence (verified with two independent tldraw stores pushing to the
 * same docKey — see Tier 6 commit) without it.
 */
export function useSyncedWhiteboardStore(docKey: string, pollMs = 4000): TLStore {
  const { doc, tlStore } = useMemo(() => getHandle(docKey), [docKey]);

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
        // Offline or backend unreachable — local IndexedDB state stays
        // correct, retry on the next tick or the next `online` event.
      }
    }

    void syncNow();
    const interval = setInterval(syncNow, pollMs);
    window.addEventListener("online", syncNow);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", syncNow);
    };
  }, [doc, docKey, pollMs]);

  return tlStore;
}
