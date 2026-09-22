import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DisciplineSchema } from "@the-desk/shared";
import { db } from "../db.js";
import { hashPassword, signToken, verifyPassword } from "../auth.js";

function publicUser(user: { id: string; email: string; displayName: string; activeDiscipline: string }) {
  return { id: user.id, email: user.email, displayName: user.displayName, activeDiscipline: user.activeDiscipline };
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
}
