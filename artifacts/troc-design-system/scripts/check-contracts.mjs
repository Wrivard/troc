/** Typecheck the package and its public consumer import/label contracts together. */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configFile = ts.readConfigFile(resolve(root, "tsconfig.json"), ts.sys.readFile);
if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root, undefined, resolve(root, "tsconfig.json"));
const names = readdirSync(resolve(root, "src/components/ui")).filter((file) => file.endsWith(".tsx")).map((file) => file.slice(0, -4)).sort();
assert.equal(names.length, 46);
const namespace = (name) => `Family${names.indexOf(name)}`;
const imports = names.map((name, index) => `import * as Family${index} from "@workspace/troc-design-system/components/ui/${name}";`).join("\n");
const fixtures = `
${imports}
import "@workspace/troc-design-system/styles.css";
import * as designTokens from "@workspace/troc-design-system/tokens";
import { PreferencesProvider } from "@workspace/troc-design-system/hooks/use-preferences";
export const available = [${names.map((_, index) => `Family${index}`).join(",")}, designTokens, PreferencesProvider];
export const explicitLabel = <${namespace("dialog")}.DialogContent closeLabel="Close" />;
export const customClose = <${namespace("dialog")}.DialogContent hideClose />;
export const explicitDrawerLabel = <${namespace("drawer")}.DrawerContent closeLabel="Close" />;
export const explicitToastLabel = <${namespace("toast")}.Toaster closeLabel="Close" />;
export const removableChip = <${namespace("chips")}.Chip selectable onRemove={()=>{}} removeLabel="Remove sample">Sample</${namespace("chips")}.Chip>;
// @ts-expect-error A visible built-in close control must be labelled by the caller.
export const missingDialogLabel = <${namespace("dialog")}.DialogContent />;
// @ts-expect-error Drawers follow the same translated-close contract.
export const missingDrawerLabel = <${namespace("drawer")}.DrawerContent />;
// @ts-expect-error Toasts require an explicit translated default close label.
export const missingToastLabel = <${namespace("toast")}.Toaster />;
// @ts-expect-error A removable chip requires a translated remove label.
export const missingRemoveLabel = <${namespace("chips")}.Chip onRemove={()=>{}} />;
// @ts-expect-error The approved Button API intentionally has no link variant.
export const unsupportedVariant = <${namespace("button")}.Button variant="link" />;
`;
const virtualFile = resolve(root, "src/__public_api_check__.tsx");
const host = ts.createCompilerHost(config.options);
host.getCurrentDirectory = () => root;
const originalSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (file, version, onError, createNew) => file === virtualFile
  ? ts.createSourceFile(file, fixtures, version, true, ts.ScriptKind.TSX)
  : originalSourceFile(file, version, onError, createNew);
const program = ts.createProgram([...config.fileNames, virtualFile], { ...config.options, noEmit: true }, host);
const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => root,
    getNewLine: () => "\n",
  }));
  process.exitCode = 1;
} else {
  const css = readFileSync(resolve(root, "src/index.css"), "utf8");
  assert.ok(!/\.ds-(sidebar|main|page-header|applied|mobile-only|desktop-only)\b/.test(css), "Consumer CSS must not include guide layout.");
  console.log("PASS: package TypeScript, all 46 public imports, tokens/styles/preferences exports, required translated labels, and consumer CSS boundaries.");
}