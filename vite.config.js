import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { middleware } from "./server/local.mjs";
export default defineConfig({
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
});
