import { useState, type CSSProperties } from "react";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { usePreferences } from "../../hooks/use-preferences";
import { useFeedbackMessages } from "../../lib/messages-feedback";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

const srOnly: CSSProperties = {
  position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
  overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0,
};

export default function SkeletonDemo() {
  usePreferences();
  const { tf } = useFeedbackMessages();
  const [loading, setLoading] = useState(true);

  return (
    <>
      <PageHeader eyebrow={tf("eyebrow")} title={tf("skeletonTitle")} description={tf("skeletonIntro")} />

      <Section title={tf("shapesTitle")}>
        <DemoPanel>
          <div className="ds-form-grid">
            <Stack label={tf("shapeText")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton shape="text" />
                <Skeleton shape="text" />
                <Skeleton shape="text" />
              </div>
            </Stack>
            <Stack label={tf("shapeRow")}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton shape="avatar" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton shape="text" />
                  <Skeleton shape="text" />
                </div>
              </div>
            </Stack>
          </div>
          <p className="ds-helper" style={{ marginTop: 16 }}>{tf("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={tf("shapeCard")}>
        <DemoPanel>
          <div style={{ marginBottom: 20 }}>
            <Button variant="outline" onClick={() => setLoading((value) => !value)} aria-pressed={loading}>
              {tf("toggleLoading")}
            </Button>
          </div>
          <div aria-busy={loading} style={{ maxWidth: 220 }}>
            {loading ? (
              <>
                <span role="status" style={srOnly}>{tf("loadingLabel")}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Skeleton shape="card" />
                  <Skeleton shape="text" />
                  <Skeleton shape="text" />
                  <Skeleton shape="text" />
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ aspectRatio: "3 / 4", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface-hover)" }} aria-hidden="true" />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{tf("cardName")}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{tf("cardMeta")}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{tf("cardSeller")}</p>
              </div>
            )}
          </div>
          <p className="ds-inline-status" role="status">{loading ? tf("loadingLabel") : tf("loadedTitle")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tf("skeletonDo") }, { kind: "dont", text: tf("skeletonDont") }]} />
    </>
  );
}
