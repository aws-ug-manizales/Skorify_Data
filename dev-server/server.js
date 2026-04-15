const express = require("express");

const app = express();
app.use(express.json());

function loadSkorifyData() {
  // Local package is currently compiled as CommonJS (dist/lib/index.js uses require/exports)
  // so we load it with require here.
  // eslint-disable-next-line global-require
  return require("skorifydata");
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/exports", (_req, res) => {
  const mod = loadSkorifyData();
  const keys = Object.keys(mod).sort();
  res.json({
    ok: true,
    package: "skorifydata",
    exportKeys: keys,
    hasDBClient: typeof mod.DBClient === "function",
  });
});

app.get("/dbclient-shape", (_req, res) => {
  const { DBClient } = loadSkorifyData();
  if (typeof DBClient !== "function") {
    return res.status(500).json({ ok: false, error: "DBClient export not found" });
  }

  // We don't connect here (needs DB config). This just proves the class loads.
  const protoMethods = Object.getOwnPropertyNames(DBClient.prototype).sort();
  return res.json({ ok: true, protoMethods });
});

app.get("/users", async (_req, res) => {
  const { DBClient } = loadSkorifyData();
  console.log(process.env);
  const dbClient = new DBClient({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "polla_mundial",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
  });
  await dbClient.connect();
  const users = await dbClient.users.findAllActive();
  res.json({ ok: true, users });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // Keep output minimal but explicit for dev usage.
  // eslint-disable-next-line no-console
  console.log(`dev-instance listening on http://localhost:${port}`);
});

