import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import {
  boundedFraming,
  centeredFraming,
  coverGeometry,
  demoCoverRules,
  validateCoverDimensions,
  validateCoverFile,
  type CoverFraming,
  type CoverImageRules,
} from "./crop";
import "./store-cover-editor.css";
export interface StoreCoverValue {
  sourceUrl: string;
  width: number;
  height: number;
  framing: CoverFraming;
}
export interface StoreCoverSave {
  originalFile?: File;
  width: number;
  height: number;
  framing: CoverFraming;
}
export interface StoreCoverEditorProps {
  locale: "en" | "fr";
  value: StoreCoverValue;
  rules?: CoverImageRules;
  onSave: (draft: StoreCoverSave) => Promise<void>;
  onCancel: () => void;
}
export function StoreCoverEditor({
  locale,
  value,
  rules = demoCoverRules,
  onSave,
  onCancel,
}: StoreCoverEditorProps) {
  const fr = locale === "fr",
    id = useId();
  const [source, setSource] = useState(value);
  const [framing, setFraming] = useState(() => boundedFraming(value.framing));
  const [file, setFile] = useState<File>();
  const [pending, setPending] = useState(false),
    [decoding, setDecoding] = useState(false);
  const [error, setError] = useState<string>(),
    [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const ownedUrl = useRef<string | undefined>(undefined),
    generation = useRef(0),
    alive = useRef(true);
  const release = () => {
    if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
    ownedUrl.current = undefined;
  };
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current++;
      release();
    };
  }, []);
  useEffect(() => {
    generation.current++;
    release();
    setSource(value);
    setFraming(boundedFraming(value.framing));
    setFile(undefined);
    setDecoding(false);
    setPending(false);
    setError(undefined);
    setSaved(false);
  }, [value]);
  const message = (code: string) =>
    code === "type"
      ? fr
        ? "Choisissez une image JPEG, PNG ou WebP."
        : "Choose a JPEG, PNG or WebP image."
      : code === "size"
        ? fr
          ? `Choisissez un fichier non vide de ${Math.round(rules.maxBytes / 1024 / 1024)} Mo maximum.`
          : `Choose a nonempty file up to ${Math.round(rules.maxBytes / 1024 / 1024)} MB.`
        : code === "dimensions"
          ? fr
            ? `Image requise : au moins ${rules.minWidth} × ${rules.minHeight} px, au plus ${rules.maxSide} px par côté et ${rules.maxPixels / 1_000_000} mégapixels.`
            : `Image must be at least ${rules.minWidth} × ${rules.minHeight} px, no more than ${rules.maxSide} px per side and ${rules.maxPixels / 1_000_000} megapixels.`
          : fr
            ? "Impossible de lire cette image. Essayez un autre fichier."
            : "This image could not be read. Try another file.";
  const selectFile = async (next: File) => {
    const request = ++generation.current;
    setSaved(false);
    setError(undefined);
    setDecoding(false);
    const invalid = validateCoverFile(next, rules);
    if (invalid) {
      setError(message(invalid));
      return;
    }
    const url = URL.createObjectURL(next);
    setDecoding(true);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!alive.current || generation.current !== request) {
        URL.revokeObjectURL(url);
        return;
      }
      const dimensionError = validateCoverDimensions(
        image.naturalWidth,
        image.naturalHeight,
        rules,
      );
      if (dimensionError) {
        URL.revokeObjectURL(url);
        setError(message(dimensionError));
        return;
      }
      release();
      ownedUrl.current = url;
      setSource({
        sourceUrl: url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        framing: centeredFraming,
      });
      setFile(next);
      setFraming({ ...centeredFraming });
    } catch {
      URL.revokeObjectURL(url);
      if (alive.current && generation.current === request)
        setError(message("decode"));
    } finally {
      if (alive.current && generation.current === request) setDecoding(false);
    }
  };
  const save = async () => {
    if (pending || decoding) return;
    const request = generation.current;
    setPending(true);
    setError(undefined);
    setSaved(false);
    try {
      await onSave({
        originalFile: file,
        width: source.width,
        height: source.height,
        framing: { ...framing },
      });
      if (alive.current && generation.current === request) setSaved(true);
    } catch {
      if (alive.current && generation.current === request)
        setError(
          fr
            ? "Enregistrement impossible. Votre cadrage est conservé; réessayez."
            : "Could not save. Your framing is retained; try again.",
        );
    } finally {
      if (alive.current && generation.current === request) setPending(false);
    }
  };
  const cancel = () => {
    generation.current++;
    release();
    setDecoding(false);
    setSource(value);
    setFile(undefined);
    setFraming(boundedFraming(value.framing));
    setError(undefined);
    setSaved(false);
    onCancel();
  };
  const preview = (ratio: number, label: string) => {
    const geometry = coverGeometry(source.width, source.height, ratio, framing);
    return (
      <figure className="troc-cover-editor-preview">
        <figcaption>
          {label} <span>{ratio === 2.5 ? "5:2" : "16:9"}</span>
        </figcaption>
        <div className="troc-cover-editor-frame" style={{ aspectRatio: ratio }}>
          <img
            alt={
              fr
                ? `Aperçu du cadrage : ${label}`
                : `Cover framing preview: ${label}`
            }
            src={source.sourceUrl}
            draggable={false}
            style={{
              width: `${geometry.width}%`,
              height: `${geometry.height}%`,
              left: `${geometry.left}%`,
              top: `${geometry.top}%`,
            }}
          />
        </div>
      </figure>
    );
  };
  return (
    <section
      className="troc-cover-editor"
      aria-labelledby={`${id}-title`}
      aria-busy={pending || decoding}
    >
      <header>
        <p className="troc-cover-editor-kicker">
          {fr ? "IDENTITÉ DE LA BOUTIQUE" : "STORE IDENTITY"}
        </p>
        <h1 id={`${id}-title`}>
          {fr ? "Cadrez votre couverture." : "Frame your store cover."}
        </h1>
        <p>
          {fr
            ? "Gardez l’essentiel visible, du grand écran au téléphone."
            : "Keep what matters in view, from desktop to phone."}
        </p>
      </header>
      <div className="troc-cover-editor-layout">
        <div className="troc-cover-editor-previews">
          {preview(2.5, fr ? "Ordinateur" : "Desktop")}
          {preview(
            16 / 9,
            fr ? "Téléphone et carte boutique" : "Phone and store card",
          )}
        </div>
        <div className="troc-cover-editor-controls">
          <h2>{fr ? "Image et cadrage" : "Image and framing"}</h2>
          <div className="troc-cover-editor-file">
            <Button
              type="button"
              variant="secondary"
              disabled={pending || decoding}
              aria-describedby={`${id}-rules`}
              onClick={() => fileInput.current?.click()}
            >
              {fr ? "Choisir une image" : "Choose an image"}
            </Button>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={pending || decoding}
              aria-label={fr ? "Fichier de couverture" : "Cover image file"}
              onChange={(event) => {
                const next = event.target.files?.[0];
                event.target.value = "";
                if (next) void selectFile(next);
              }}
            />
          </div>
          <p id={`${id}-rules`} className="troc-cover-editor-hint">
            JPEG, PNG, WebP · {Math.round(rules.maxBytes / 1024 / 1024)}{" "}
            {fr ? "Mo max." : "MB max."} · {fr ? "Minimum" : "At least"}{" "}
            {rules.minWidth} × {rules.minHeight} px.
          </p>
          <p className="troc-cover-editor-source">
            {file ? file.name : fr ? "Image actuelle" : "Current image"} ·{" "}
            {source.width} × {source.height} px
          </p>
          {source.height > source.width && (
            <p className="troc-cover-editor-hint">
              {fr
                ? "Image verticale : une grande partie sera recadrée. Vérifiez les deux aperçus."
                : "Portrait image: much of it will be cropped. Check both previews."}
            </p>
          )}
          <fieldset disabled={pending || decoding}>
            <legend>{fr ? "Ajuster le cadrage" : "Adjust framing"}</legend>
            {(["x", "y", "zoom"] as const).map((key) => (
              <label key={key} htmlFor={`${id}-${key}`}>
                <span>
                  {key === "x"
                    ? fr
                      ? "Position horizontale"
                      : "Horizontal position"
                    : key === "y"
                      ? fr
                        ? "Position verticale"
                        : "Vertical position"
                      : "Zoom"}
                  <output>
                    {key === "zoom"
                      ? `${Math.round(framing[key] * 100)}%`
                      : `${framing[key]}%`}
                  </output>
                </span>
                <input
                  id={`${id}-${key}`}
                  type="range"
                  min={key === "zoom" ? 1 : 0}
                  max={key === "zoom" ? 3 : 100}
                  step={key === "zoom" ? 0.05 : 1}
                  value={framing[key]}
                  aria-valuetext={`${Math.round(key === "zoom" ? framing[key] * 100 : framing[key])}%`}
                  onChange={(event) => {
                    setSaved(false);
                    setFraming((previous) =>
                      boundedFraming({
                        ...previous,
                        [key]: Number(event.target.value),
                      }),
                    );
                  }}
                />
              </label>
            ))}
          </fieldset>
          <p className="troc-cover-editor-hint">
            {fr
              ? "Utilisez les flèches du clavier pour affiner. Début et Fin atteignent les limites. Les deux aperçus partagent le même cadrage."
              : "Use arrow keys to fine-tune. Home and End reach the limits. Both previews share the same framing."}
          </p>
          <Button
            type="button"
            variant="ghost"
            disabled={pending || decoding}
            onClick={() => {
              setFraming({ ...centeredFraming });
              setSaved(false);
            }}
          >
            {fr ? "Centrer et dézoomer" : "Center and reset zoom"}
          </Button>
          <p className="troc-cover-editor-hint">
            {fr
              ? "L’original reste intact. Seul le cadrage change."
              : "Your original stays intact. Only the framing changes."}
          </p>
          {error && (
            <p role="alert" className="troc-cover-editor-error">
              {error}
            </p>
          )}
          <p role="status" aria-live="polite">
            {decoding
              ? fr
                ? "Lecture de l’image…"
                : "Reading image…"
              : pending
                ? fr
                  ? "Enregistrement…"
                  : "Saving…"
                : saved
                  ? fr
                    ? "Cadrage enregistré."
                    : "Framing saved."
                  : ""}
          </p>
          <div className="troc-cover-editor-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={cancel}
            >
              {fr ? "Annuler" : "Cancel"}
            </Button>
            <Button
              type="button"
              disabled={pending || decoding}
              onClick={() => void save()}
            >
              {pending
                ? fr
                  ? "Enregistrement…"
                  : "Saving…"
                : fr
                  ? "Enregistrer le cadrage"
                  : "Save framing"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
