import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../../../../..");
const git = ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, "-C", root];
const prefix =
  "artifacts/marketplace/src/modules/account/sign-in-presentation/";
for (const file of [
  "SignInLayout.tsx",
  "sign-in-layout.css",
  "assets/bg-login.png",
]) {
  const output = path.join(here, "baseline", file);
  await fs.mkdir(path.dirname(output), { recursive: true });
  let data = execFileSync("git", [...git, "show", `c1853c4:${prefix}${file}`], {
    maxBuffer: 4 * 1024 * 1024,
  });
  if (file.endsWith(".tsx"))
    data = globalThis.Buffer.from(
      data
        .toString("utf8")
        .replace('"../../../messages"', '"../../../../../messages"'),
    );
  await fs.writeFile(output, data);
}
globalThis.console.log(
  "Prepared frozen c1853c4 SignInLayout presentation only; no auth controller copied.",
);
