import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DisciplineSchema } from "@the-desk/shared";
import { db } from "../db.js";
import { hashPassword, signToken, verifyPassword } from "../auth.js";

function publicUser(user: {
  id: string;
  email: string;
  displayName: string;
  activeDiscipline: string;
  deskThemeOverride?: unknown;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    activeDiscipline: user.activeDiscipline,
    deskThemeOverride: user.deskThemeOverride ?? null,
  };
}

export async function authRoutes(app: FastifyInstance) {
  const RegisterBody = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1),
    activeDiscipline: DisciplineSchema,
  });

  app.post("/auth/register", async (req, reply) => {
    const body = RegisterBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const existing = await db.user.findUnique({ where: { email: body.data.email } });
    if (existing) return reply.code(409).send({ error: "An account with this email already exists" });

    const user = await db.user.create({
      data: {
        email: body.data.email,
        passwordHash: await hashPassword(body.data.password),
        displayName: body.data.displayName,
        activeDiscipline: body.data.activeDiscipline,
      },
    });

    return { token: signToken(user.id), user: publicUser(user) };
  });

  const LoginBody = z.object({ email: z.string().email(), password: z.string().min(1) });

  app.post("/auth/login", async (req, reply) => {
    const body = LoginBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const user = await db.user.findUnique({ where: { email: body.data.email } });
    const validPassword = user && (await verifyPassword(body.data.password, user.passwordHash));
    if (!user || !validPassword) {
      // Deliberately the same error for "no such user" and "wrong password" —
      // distinguishing them lets an attacker enumerate registered emails.
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    return { token: signToken(user.id), user: publicUser(user) };
  });

  app.get("/auth/me", async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: "Not authenticated" });
    const user = await db.user.findUnique({ where: { id: req.userId } });
    if (!user) return reply.code(401).send({ error: "Not authenticated" });
    return publicUser(user);
  });

  // Tier 7's user desk/wall customization: a partial override merged on top
  // of the active discipline's DeskTheme client-side (see
  // scene/disciplineTheme.ts) — only deskWood/wall are overridable, not
  // every object's color, since this tier is scoped to "desk/wall"
  // specifically, not a full per-object re-theme.
  const DeskThemeOverrideBody = z.object({
    deskWood: z.string().optional(),
    wall: z.string().optional(),
  });

  app.patch("/auth/me/desk-theme", async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: "Not authenticated" });
    const body = DeskThemeOverrideBody.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error.flatten());

    const existing = await db.user.findUnique({ where: { id: req.userId } });
    if (!existing) return reply.code(401).send({ error: "Not authenticated" });

    // Merge onto whatever's already stored — a click on one swatch (e.g.
    // wall color) must not blow away a previously-picked value for the
    // other field (desk wood), since the panel sends one field per click.
    const existingOverride = (existing.deskThemeOverride as { deskWood?: string; wall?: string } | null) ?? {};
    const merged = {
      ...existingOverride,
      ...(body.data.deskWood !== undefined ? { deskWood: body.data.deskWood } : {}),
      ...(body.data.wall !== undefined ? { wall: body.data.wall } : {}),
    };

    const user = await db.user.update({
      where: { id: req.userId },
      data: { deskThemeOverride: merged },
    });
    return publicUser(user);
  });
}
