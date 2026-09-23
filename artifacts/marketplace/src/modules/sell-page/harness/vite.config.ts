import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../../../public", import.meta.url)),
  plugins: [react(), tailwindcss()],
  server: { host: "127.0.0.1", port: 4318, strictPort: true },
  build: {
    target: "esnext",
    outDir: fileURLToPath(
      new URL("../../../../../../verification/sell-page-dist", import.meta.url),
    ),
    emptyOutDir: false,
  },
});
