import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import type { PublicPage } from "@workspace/catalog";
import { PublicRoot } from "./modules/catalog/PublicRoot";
/** Resolve lazy public sections before hydration; renderToString cannot finish Suspense. */
export function render(page: PublicPage, theme: "dark" | "light"): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => { stream.abort(); reject(new Error("ssr_timeout")); }, 10000);
    output.on("data", chunk => chunks.push(Buffer.from(chunk)));
    output.on("end", () => { clearTimeout(timer); resolve(Buffer.concat(chunks).toString("utf8")); });
    output.on("error", error => { clearTimeout(timer); reject(error); });
    const stream = renderToPipeableStream(<PublicRoot path={page.path} page={page} theme={theme} />, {
      onAllReady() { stream.pipe(output); },
      onShellError(error) { clearTimeout(timer); reject(error); },
      onError(error) { clearTimeout(timer); reject(error); },
    });
  });
}
