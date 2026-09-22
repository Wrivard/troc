import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
  ssr: { noExternal: true },
  build: { manifest: true },
  server: { port: Number(process.env.PORT || 5173), strictPort: true, proxy: { "/api": process.env.API_ORIGIN || "http://127.0.0.1:3001" } },
});
