import express from "express";
import type { Request, Response } from "express";
import { DBClient } from "skorifydata";

const app = express();
app.use(express.json());

const dbClient = new DBClient({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "polla_mundial",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

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

app.get("/:entity", async (_req: Request, res: Response) => {
  const entity = _req.params.entity as string;
  try {
    await dbClient.connect();
    const service = dbClient.getServiceByName(entity);
    const data = await service.getAll();
    return res.json({ ok: true, [entity]: data });
  } catch (error) {
    console.error(`Error getting ${entity}:`, error);
    return res.status(500).json({ ok: false, error: `Failed to get ${entity}` });
  } finally {
    await dbClient.disconnect();
  }
});


app.get("/:entity/:id", async (_req: Request, res: Response) => {
  const { id, entity } = _req.params as { id: string; entity: string };
  try {
    await dbClient.connect();
    const service = dbClient.getServiceByName(entity);
    const data = await service.getById(id as string);
    return res.json({ ok: true, [entity as string]: data });
  } catch (error) {
    console.error(`Error getting ${entity}:`, error);
    return res.status(500).json({ ok: false, error: `Failed to get ${entity}` });
  } finally {
    await dbClient.disconnect();
  }
});

app.post("/:entity", async (_req: Request, res: Response) => {
  const entity = _req.params.entity as string;
  try {
    await dbClient.connect();
    console.log(`Created new ${entity}:`, _req.body);
    const service = dbClient.getServiceByName(entity);
    const newData = await service.save(_req.body);
    return res.status(201).json({ ok: true, [entity]: newData });
  } catch (error) {
    console.error(`Error creating ${entity}:`, error);
    return res.status(500).json({ ok: false, error: `Failed to create ${entity}` });
  } finally {
    await dbClient.disconnect();
  }
});

app.put("/:entity/:id", async (_req: Request, res: Response) => {
  const { id, entity } = _req.params as { id: string; entity: string };
  try {
    await dbClient.connect();
    console.log(`Updating ${entity} with id ${id}:`, _req.body);
    const service = dbClient.getServiceByName(entity);
    const updatedData = await service.modifyById(id, _req.body);
    return res.json({ ok: true, [entity]: updatedData });
  } catch (error) {
    console.error(`Error updating ${entity} with id ${id}:`, error);
    return res.status(500).json({ ok: false, error: `Failed to update ${entity}` });
  } finally {
    await dbClient.disconnect();
  }
});

app.delete("/:entity/:id", async (_req: Request, res: Response) => {
  const { id, entity } = _req.params as { id: string; entity: string };
  try {
    await dbClient.connect();
    const service = dbClient.getServiceByName(entity);
    await service.delete(id);
    return res.json({ ok: true, message: `${entity} with id ${id} deleted` });
  } catch (error) {
    console.error(`Error deleting ${entity} with id ${id}:`, error);
    return res.status(500).json({ ok: false, error: `Failed to delete ${entity}` });
  } finally {
    await dbClient.disconnect();
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`dev-instance listening on http://localhost:${port}`);
});
