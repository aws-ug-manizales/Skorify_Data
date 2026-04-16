import express from "express";
import type { Request, Response } from "express";
import { DBClient } from "skorifydata";

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/exports", (_req: Request, res: Response) => {
  const mod = require("skorifydata") as Record<string, unknown>;
  const keys = Object.keys(mod).sort();
  res.json({
    ok: true,
    package: "skorifydata",
    exportKeys: keys,
    hasDBClient: typeof mod.DBClient === "function",
  });
});

app.get("/dbclient-shape", (_req: Request, res: Response) => {
  if (typeof DBClient !== "function") {
    return res.status(500).json({ ok: false, error: "DBClient export not found" });
  }

  const protoMethods = Object.getOwnPropertyNames(DBClient.prototype).sort();
  return res.json({ ok: true, protoMethods });
});

app.get("/users", async (_req: Request, res: Response) => {
  const dbClient = new DBClient({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "polla_mundial",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
  });

  try {
    await dbClient.connect();
    const users = await dbClient.users.findAllActive();
    return res.json({ ok: true, users });
  } finally {
    await dbClient.disconnect();
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`dev-instance listening on http://localhost:${port}`);
});
