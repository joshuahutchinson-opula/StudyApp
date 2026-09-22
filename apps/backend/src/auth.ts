import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const envSecret = process.env.JWT_SECRET;
if (!envSecret) {
  throw new Error("JWT_SECRET must be set — see apps/backend/.env.example");
}
const JWT_SECRET: string = envSecret;

const TOKEN_TTL = "30d";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "object" && typeof payload.sub === "string") return payload.sub;
    return null;
  } catch {
    return null;
  }
}
