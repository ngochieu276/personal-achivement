import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.ts";
import { projectRoutes } from "./routes/projects.ts";
import { subjectRoutes } from "./routes/subjects.ts";
import { closeAllOverdue } from "./period.ts";

const app = new Hono();

const origins = (Deno.env.get("FRONTEND_ORIGIN") ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: origins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
