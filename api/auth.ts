import bcrypt from "bcryptjs";
import * as jose from "jose";
import type { MiddlewareHandler } from "hono";

const encoder = new TextEncoder();

function jwtSecret() {
  const secret = Deno.env.get("JWT_SECRET");
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return encoder.encode(secret);
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export async function signToken(user: { id: string; email: string }) {
  return await new jose.SignJWT({ email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(jwtSecret());
}

export async function verifyToken(token: string) {
  const { payload } = await jose.jwtVerify(token, jwtSecret());
  if (!payload.sub) {
    throw new Error("Invalid token");
  }
  return { userId: payload.sub, email: String(payload.email ?? "") };
}

export function publicUser(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export const authMiddleware: MiddlewareHandler<{
  Variables: { user: AuthUser };
}> = async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { userId, email } = await verifyToken(token);
    c.set("user", {
      id: userId,
      email,
      name: "",
      createdAt: new Date(0),
    });
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
};
