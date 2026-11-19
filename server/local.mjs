import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { api } from "./api.js";

export function abrirDB(archivo) {
  if (!archivo) {
    mkdirSync(".local", { recursive: true });
    archivo = ".local/bovimarket.sqlite";
  }
  const sql = new DatabaseSync(archivo);
  sql.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS migraciones (nombre TEXT PRIMARY KEY)",
  );
  for (const nombre of readdirSync(new URL("../drizzle/", import.meta.url))
    .filter((x) => x.endsWith(".sql"))
    .sort()) {
    if (
      sql.prepare("SELECT nombre FROM migraciones WHERE nombre=?").get(nombre)
    )
      continue;
    sql.exec("BEGIN IMMEDIATE");
    try {
      sql.exec(
        readFileSync(new URL("../drizzle/" + nombre, import.meta.url), "utf8"),
      );
      sql.prepare("INSERT INTO migraciones VALUES (?)").run(nombre);
      sql.exec("COMMIT");
    } catch (err) {
      sql.exec("ROLLBACK");
      throw err;
    }
  }
  function preparar(query, params = []) {
    const stmt = sql.prepare(query);
    return {
      bind: (...args) => preparar(query, args),
      first: () => stmt.get(...params) || null,
      all: () => ({ results: stmt.all(...params) }),
      run: () => stmt.run(...params),
    };
  }
  return {
    prepare: preparar,
    batch(stmts) {
      sql.exec("BEGIN IMMEDIATE");
      try {
        const rows = stmts.map((s) => s.run());
        sql.exec("COMMIT");
        return rows;
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
    close: () => sql.close(),
  };
}
export function middleware() {
  let db;
  return async (req, res, next) => {
    if (!req.url.startsWith("/api/")) return next();
    try {
      db ||= abrirDB();
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers))
        if (typeof value === "string") headers.set(key, value);
      const init = { method: req.method, headers };
      if (!["GET", "HEAD"].includes(req.method))
        Object.assign(init, { body: req, duplex: "half" });
      const origin = "http://" + req.headers.host;
      const request = new Request(new URL(req.url, origin), init);
      const response = await api(request, db);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (err) {
      console.error(err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No se pudo abrir la base de datos." }));
    }
  };
}
