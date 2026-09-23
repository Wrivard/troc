import { useId } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Checkbox } from "@workspace/troc-design-system/components/ui/selection-controls";
import googleMark from "./assets/google-g.png";
import "./google-sign-in-presentation.css";

export interface GoogleSignInPresentationProps {
  locale: "en" | "fr";
  enabled: boolean | null;
  confirmed: boolean;
  busy: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onStart: () => void;
  /** Pass the existing controller's translated strings unchanged. */
  labels: {
    action: string;
    canada: string;
    loading: string;
    unavailable: string;
  };
}
/** No auth state or requests: A's existing GoogleSignIn supplies the exact controller state. */
export function GoogleSignInPresentation({
  locale,
  enabled,
  confirmed,
  busy,
  onConfirmedChange,
  onStart,
  labels,
}: GoogleSignInPresentationProps) {
  const id = useId();
  const unavailable = enabled !== true;
  return (
    <section className="troc-google-signin" aria-label={labels.action}>
      <div className="troc-google-signin-divider" aria-hidden="true">
        <span>{locale === "fr" ? "ou" : "or"}</span>
      </div>
      <label className="troc-google-signin-consent">
        <Checkbox
          checked={confirmed}
          onCheckedChange={(value) => onConfirmedChange(value === true)}
          disabled={busy || enabled !== true}
        />
        <span>{labels.canada}</span>
      </label>
      <Button
        type="button"
        variant="outline"
        className="troc-google-signin-button"
        disabled={busy || enabled !== true || !confirmed}
        aria-describedby={unavailable ? id : undefined}
        onClick={onStart}
      >
        <img
          src={googleMark}
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
        />
        <span>{labels.action}</span>
      </Button>
      {unavailable && (
        <p id={id} role="status" className="troc-google-signin-status">
          {enabled === null ? labels.loading : labels.unavailable}
        </p>
      )}
    </section>
  );
}
