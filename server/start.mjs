import { createServer } from "node:http";
import { middleware } from "./local.mjs";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
const dir = resolve("dist/client");
await stat(resolve(dir, "index.html")).catch(() => {
  throw Error("Ejecuta npm run build antes de iniciar.");
});
const port = Number(process.env.PORT || 4173),
  run = middleware();
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
createServer((req, res) =>
  run(req, res, async () => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = resolve(
        dir,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!file.startsWith(dir + sep)) {
        res.writeHead(404);
        return res.end();
      }
      const data = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[extname(file)] || "application/octet-stream",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Recurso no encontrado");
    }
  }),
).listen(port, () => console.log("Bovimarket · http://localhost:" + port));
