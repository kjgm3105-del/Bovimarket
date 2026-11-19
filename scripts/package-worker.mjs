import { build } from "esbuild";
import { mkdir, readFile, writeFile, readdir, cp } from "node:fs/promises";
import { extname } from "node:path";
const catalog = {};
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
async function collect(dir) {
  for (const entry of await readdir("dist/client" + dir, {
    withFileTypes: true,
  })) {
    const key = dir + "/" + entry.name;
    if (entry.isDirectory()) await collect(key);
    else
      catalog[key] = [
        types[extname(key)] || "application/octet-stream",
        (await readFile("dist/client" + key)).toString("base64"),
      ];
  }
}
await collect("");
await mkdir("dist/server", { recursive: true });
await build({
  entryPoints: ["server/worker.js"],
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  define: { BOVIMARKET_ASSETS: JSON.stringify(catalog) },
  outfile: "dist/server/index.js",
});
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
console.log("SPA y API de producción listas.");
