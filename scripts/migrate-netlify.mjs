import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
if (!process.env.TURSO_DATABASE_URL)
  throw Error(
    "Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en Netlify antes de desplegar.",
  );
const cliente = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
try {
  await cliente.execute(
    "CREATE TABLE IF NOT EXISTS migraciones (nombre TEXT PRIMARY KEY)",
  );
  for (const nombre of (await readdir("drizzle"))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    const tx = await cliente.transaction("write");
    try {
      const row = await tx.execute({
        sql: "SELECT nombre FROM migraciones WHERE nombre=?",
        args: [nombre],
      });
      if (!row.rows.length) {
        const sql = await readFile("drizzle/" + nombre, "utf8");
        for (const stmt of sql
          .split("--> statement-breakpoint")
          .map((s) => s.trim())
          .filter(Boolean))
          await tx.execute(stmt);
        await tx.execute({
          sql: "INSERT INTO migraciones VALUES (?)",
          args: [nombre],
        });
      }
      await tx.commit();
    } finally {
      tx.close();
    }
  }
} finally {
  cliente.close();
}
