import { mkdir, writeFile, access } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";
const file = ".local/test-accounts/credentials.json";
try {
  await access(file);
  throw new Error("Credentials already exist; refusing to replace them.");
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
await mkdir(".local/test-accounts", { recursive: true });
const credentials = {},
  display = [];
for (const role of ["buyer", "seller", "admin"]) {
  const password =
    "Troc-" + role + "-" + randomBytes(9).toString("base64url") + "!";
  const salt = randomBytes(16).toString("hex");
  credentials[role] = {
    salt,
    hash: scryptSync(password, salt, 32).toString("hex"),
  };
  display.push(role + "@troc.test | " + password);
}
await writeFile(file, JSON.stringify(credentials, null, 2), { flag: "wx" });
console.log(
  "Local test credentials — save these; only hashes are stored.\n" +
    display.join("\n"),
);
