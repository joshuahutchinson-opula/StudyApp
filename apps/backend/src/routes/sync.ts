import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as Y from "yjs";
import { db } from "../db.js";

// Offline-first CRDT sync (Tier 3 of the 3D pivot). Clients keep their own
// Y.Doc locally (see scene/useYDoc.ts) and push their update bytes here on
// reconnect. We never overwrite what's stored: we load the existing bytes
// into a fresh server-side Y.Doc, apply the incoming update on top via
// Y.applyUpdate (this is the actual CRDT merge — it's commutative and
// idempotent, so two devices that edited offline converge on the same state
// regardless of order), then hand back the full merged state so the client
// can apply anything it didn't already have. Naive last-write-wins would
// silently drop one device's edits; this doesn't.
export async function syncRoutes(app: FastifyInstance) {
  const Params = z.object({ docKey: z.string().min(1) });

  app.get("/sync/:docKey", async (req, reply) => {
    const params = Params.safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());

    const doc = await db.syncDoc.findUnique({
      where: { userId_docKey: { userId: req.userId!, docKey: params.data.docKey } },
    });
    if (!doc) return reply.code(404).send({ error: "No synced doc for this key" });

    return { state: Buffer.from(doc.state).toString("base64") };
  });

  const PutBody = z.object({ update: z.string().min(1) });

  app.put("/sync/:docKey", async (req, reply) => {
    const params = Params.safeParse(req.params);
    if (!params.success) return reply.code(400).send(params.error.flatten());
    const body = PutBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const incoming = Buffer.from(body.data.update, "base64");

    const existing = await db.syncDoc.findUnique({
      where: { userId_docKey: { userId: req.userId!, docKey: params.data.docKey } },
    });

    const merged = new Y.Doc();
    if (existing) {
      Y.applyUpdate(merged, existing.state);
    }
    Y.applyUpdate(merged, incoming);
    const mergedState = Buffer.from(Y.encodeStateAsUpdate(merged));

    await db.syncDoc.upsert({
      where: { userId_docKey: { userId: req.userId!, docKey: params.data.docKey } },
      create: { userId: req.userId!, docKey: params.data.docKey, state: mergedState },
      update: { state: mergedState },
    });

    return { merged: mergedState.toString("base64") };
  });
}
