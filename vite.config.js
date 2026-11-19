import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { middleware } from "./server/local.mjs";
export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.VITE_API_ORIGIN": JSON.stringify(
      mode === "pages"
        ? "https://bovimarket-campo-colombia.chattydingo512.chatgpt.site"
        : "",
    ),
  },
  plugins: [
    vue(),
    {
      name: "api-bovimarket",
      configureServer(server) {
        server.middlewares.use(middleware());
      },
    },
  ],
  build: { outDir: "dist/client", emptyOutDir: true },
  server: {
    host: "127.0.0.1",
    allowedHosts: [".chatgpt.local", ".chatgpt.com", ".chatgpt.site"],
  },
}));
