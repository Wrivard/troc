import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(
  new URL("../artifacts/marketplace/package.json", import.meta.url),
);
const { build } = await import(pathToFileURL(require.resolve("vite")).href);
await build({
  root: fileURLToPath(new URL("../artifacts/marketplace", import.meta.url)),
  build: {
    outDir: fileURLToPath(
      new URL("../node_modules/.cache/seller-platform-build", import.meta.url),
    ),
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(
        new URL(
          "../artifacts/marketplace/src/modules/seller-platform/harness.tsx",
          import.meta.url,
        ),
      ),
    },
  },
});
