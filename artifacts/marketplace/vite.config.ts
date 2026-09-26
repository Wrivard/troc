import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
/** Serve new immutable imports without relying on Vite's startup public-file index. */
const retainedArtwork = (): Plugin => ({
  name: "retained-catalog-artwork",
  configureServer(server) {
    server.middlewares.use("/catalog-art", (req, res, next) => {
      const name = (req.url ?? "").split("?")[0].slice(1);
      if (!/^retained-[a-f0-9]{64}-[0-9]+\.webp$/.test(name) || !["GET", "HEAD"].includes(req.method ?? "")) return next();
      const file = resolve(server.config.publicDir, "catalog-art", name);
      void stat(file).then(info => {
        if (!info.isFile()) { res.statusCode = 404; res.end(); return; }
        const etag = '"' + name + '"';
        res.setHeader("Content-Type", "image/webp");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("ETag", etag);
        if (req.headers["if-none-match"] === etag) { res.statusCode = 304; res.end(); return; }
        res.setHeader("Content-Length", info.size);
        if (req.method === "HEAD") { res.end(); return; }
        createReadStream(file).on("error", () => res.destroy()).pipe(res);
      }).catch(() => { res.statusCode = 404; res.end(); });
    });
  },
});
export default defineConfig(({ isSsrBuild }) => ({
  base: process.env.BASE_PATH || "/",
  plugins: [retainedArtwork(), react(), tailwindcss()],
  ssr: { noExternal: true },
  build: { manifest: true, copyPublicDir: !isSsrBuild },
  server: {
    watch: { ignored: ["**/public/catalog-art/**", "**/dist/**", "**/dist-server/**"] },
    port: Number(process.env.PORT || 5173), strictPort: true,
    proxy: { "/api": process.env.API_ORIGIN || "http://127.0.0.1:3001" },
  },
}));
