import { api } from "./api.js";
const assets = BOVIMARKET_ASSETS;
export default {
  async fetch(req, env) {
    const path = new URL(req.url).pathname;
    if (path.startsWith("/api/"))
      return api(req, env.DB, "https://kjgm3105-del.github.io");
    const asset = assets[path === "/" ? "/index.html" : path];
    if (!Array.isArray(asset) || !["GET", "HEAD"].includes(req.method))
      return new Response("Recurso no encontrado", { status: 404 });
    const [type, encoded] = asset;
    const bytes =
      req.method === "HEAD"
        ? null
        : Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    return new Response(bytes, {
      headers: {
        "Content-Type": type,
        "Cache-Control": path.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
