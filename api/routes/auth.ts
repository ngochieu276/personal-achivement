import { Hono } from "hono";
import { z } from "zod";
import {
  authMiddleware,
  hashPassword,
  publicUser,
  signToken,
  verifyPassword,
  type AuthUser,
} from "../auth.ts";
import { prisma } from "../db.ts";
import { googleClientId, verifyGoogleAccessToken, verifyGoogleCredential } from "../google.ts";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(200),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  credential: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
}).refine((value) => Boolean(value.credential || value.accessToken), {
  message: "credential or accessToken is required",
});

export const authRoutes = new Hono<{ Variables: { user: AuthUser } }>();

authRoutes.post("/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  const token = await signToken(user);
  return c.json({ token, user: publicUser(user) }, 201);
});

authRoutes.post("/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await signToken(user);
  return c.json({ token, user: publicUser(user) });
});

authRoutes.get("/google/config", (c) => {
  return c.json({ clientId: googleClientId() });
});

authRoutes.post("/google", async (c) => {
  const parsed = googleSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  let profile;
  try {
    profile = parsed.data.accessToken
      ? await verifyGoogleAccessToken(parsed.data.accessToken)
      : await verifyGoogleCredential(parsed.data.credential!);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sign-in failed";
    const status = message.includes("not configured") ? 503 : 401;
    return c.json({ error: message }, status);
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ googleId: profile.googleId }, { email: profile.email }],
    },
  });

  const user = existing
    ? await prisma.user.update({
      where: { id: existing.id },
      data: {
        googleId: existing.googleId ?? profile.googleId,
        name: existing.name || profile.name,
      },
    })
    : await prisma.user.create({
      data: {
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
      },
    });

  const token = await signToken(user);
  return c.json({ token, user: publicUser(user) }, existing ? 200 : 201);
});

authRoutes.get("/me", authMiddleware, (c) => {
  return c.json({ user: c.get("user") });
});
