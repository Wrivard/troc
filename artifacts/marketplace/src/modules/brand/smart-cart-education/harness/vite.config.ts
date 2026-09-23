import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../../../../public", import.meta.url)),
  plugins: [react(), tailwindcss()],
  server: { host: "127.0.0.1", port: 4316, strictPort: true },
  build: {
    outDir: fileURLToPath(
      new URL(
        "../../../../../../../verification/smart-education-dist",
        import.meta.url,
      ),
    ),
    emptyOutDir: false,
  },
});
