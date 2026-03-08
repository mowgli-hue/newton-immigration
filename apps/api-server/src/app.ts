import express from "express";
import cors from "cors";
import { menuRouter } from "./routes/menu.js";
import { ordersRouter } from "./routes/orders.js";
import { statusRouter } from "./routes/status.js";
import { staffCallsRouter } from "./routes/staffCalls.js";
import { kdsRouter } from "./routes/kds.js";

export function buildApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "api-server" });
  });

  app.use("/api/v1", menuRouter);
  app.use("/api/v1", ordersRouter);
  app.use("/api/v1", statusRouter);
  app.use("/api/v1", staffCallsRouter);
  app.use("/api/v1", kdsRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "production" ? undefined : message
    });
  });

  return app;
}
