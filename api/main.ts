import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.ts";
import { projectRoutes } from "./routes/projects.ts";
import { subjectRoutes } from "./routes/subjects.ts";
import { closeAllOverdue } from "./period.ts";

const app = new Hono();

const origins = [
  "http://localhost:5173",
  "https://personal-achivement.vercel.app",
  "https://personal-achivement-git-main-nguyen-ngoc-hieus-projects.vercel.app",
  "https://personal-achivement-2mcxf6lxz-nguyen-ngoc-hieus-projects.vercel.app",
  ...(Deno.env.get("FRONTEND_ORIGIN") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

function isAllowedOrigin(origin: string) {
  if (origins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    const localHost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (localHost && (url.protocol === "http:" || url.protocol === "https:")) {
      return true;
    }
    // Vercel preview deployments for this project.
    return (
      url.protocol === "https:" &&
      /^personal-achivement(-[a-z0-9-]+)?-nguyen-ngoc-hieus-projects\.vercel\.app$/.test(
        url.hostname,
      )
    );
  } catch {
    return false;
  }
}

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return origins[0];
      return isAllowedOrigin(origin) ? origin : "";
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86400,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));
app.route("/auth", authRoutes);
app.route("/projects", projectRoutes);
app.route("/subjects", subjectRoutes);

const port = Number(Deno.env.get("PORT") ?? 8080);

const closer = setInterval(() => {
  closeAllOverdue().catch((error) => {
    console.error("Failed to close overdue periods", error);
  });
}, 60_000);

try {
  Deno.addSignalListener("SIGINT", () => {
    clearInterval(closer);
    Deno.exit(0);
  });
  Deno.addSignalListener("SIGTERM", () => {
    clearInterval(closer);
    Deno.exit(0);
  });
} catch {
  // Signal listeners are unavailable in some runtimes.
}

setTimeout(() => {
  closeAllOverdue().catch((error) => {
    console.error("Failed to close overdue periods on startup", error);
  });
}, 3_000);

console.log(`API listening on http://0.0.0.0:${port}`);

Deno.serve({ port, hostname: "0.0.0.0" }, app.fetch);
