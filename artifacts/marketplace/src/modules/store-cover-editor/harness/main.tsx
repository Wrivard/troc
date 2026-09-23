import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import {
  StoreCoverEditor,
  type StoreCoverValue,
  type StoreCoverSave,
} from "../StoreCoverEditor";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import "@workspace/troc-design-system/styles.css";
import "./harness.css";
const params = new URLSearchParams(location.search),
  locale = params.get("lang") === "fr" ? "fr" : "en";
document.documentElement.className =
  params.get("theme") === "light" ? "light" : "dark";
document.documentElement.lang = locale;
const initialImage = new Image();
initialImage.src = "/demo-store-branding/cardforge-cover.webp";
await initialImage.decode();
function Harness() {
  const fr = locale === "fr";
  const [value, setValue] = useState<StoreCoverValue>({
    sourceUrl: initialImage.src,
    width: initialImage.naturalWidth,
    height: initialImage.naturalHeight,
    framing: { x: 50, y: 0, zoom: 1 },
  });
  const [fail, setFail] = useState(false),
    [shown, setShown] = useState(true),
    [last, setLast] = useState(""),
    [cancels, setCancels] = useState(0);
  const owned = useRef<string[]>([]),
    version = useRef(0);
  useEffect(
    () => () => {
      version.current++;
      for (const url of owned.current) URL.revokeObjectURL(url);
    },
    [],
  );
  const save = async (draft: StoreCoverSave) => {
    const request = version.current;
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (request !== version.current) return;
    if (fail) throw new Error("Simulated save failure");
    const url = draft.originalFile
      ? URL.createObjectURL(draft.originalFile)
      : value.sourceUrl;
    if (draft.originalFile) owned.current.push(url);
    const bytes = draft.originalFile
      ? Array.from(new Uint8Array(await draft.originalFile.arrayBuffer()))
      : null;
    if (request !== version.current) return;
    setValue({
      sourceUrl: url,
      width: draft.width,
      height: draft.height,
      framing: draft.framing,
    });
    setLast(
      JSON.stringify({
        ...draft,
        originalFile: draft.originalFile
          ? {
              name: draft.originalFile.name,
              type: draft.originalFile.type,
              size: draft.originalFile.size,
              bytes,
            }
          : null,
      }),
    );
  };
  return (
    <>
      <header className="cover-harness-header">
        <TrocLogo />
        <p>
          {fr
            ? "Banc d’essai · aucun téléversement ni stockage. Enregistrement simulé en mémoire; recharger efface les changements."
            : "Presentation harness · no upload or storage. Simulated saves live in memory; reload discards changes."}
        </p>
      </header>
      <main className="cover-harness-main">
        <aside className="cover-harness-tools">
          <label>
            <input
              type="checkbox"
              checked={fail}
              onChange={(event) => setFail(event.target.checked)}
            />
            {fr ? "Simuler un échec" : "Simulate save failure"}
          </label>
          <Button
            variant="ghost"
            onClick={() => {
              version.current++;
              setShown(!shown);
            }}
          >
            {shown
              ? fr
                ? "Fermer l’éditeur"
                : "Close editor"
              : fr
                ? "Réouvrir l’éditeur"
                : "Reopen editor"}
          </Button>
          <span data-cancel-count>{cancels}</span>
        </aside>
        {shown && (
          <StoreCoverEditor
            locale={locale}
            value={value}
            onSave={save}
            onCancel={() => {
              version.current++;
              setCancels((n) => n + 1);
            }}
          />
        )}
        <output className="cover-harness-result" data-last-save={last}>
          {last
            ? fr
              ? "Cadrage conservé uniquement dans ce banc d’essai."
              : "Framing retained only in this harness."
            : ""}
        </output>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
