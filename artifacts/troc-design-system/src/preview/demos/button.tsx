import { useEffect, useRef, useState } from "react";
import { ArrowRight, Heart, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { usePreferences } from "../../hooks/use-preferences";
import { messages } from "../../lib/messages";
import { DemoPanel, Guidelines, PageHeader, Row, Section } from "../parts";

export default function ButtonDemo() {
  const { t } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [liked, setLiked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const tryLoading = () => {
    setLoading(true); setDone(false);
    timer.current = setTimeout(() => { setLoading(false); setDone(true); }, 1200);
  };
  return <>
    <PageHeader eyebrow={t("actions")} title={t("buttons")} description={t("buttonIntro")} />
    <Section title={t("variants")}><DemoPanel>
      <Row><Button onClick={tryLoading}>{t("primary")}<ArrowRight /></Button><Button variant="secondary" onClick={tryLoading}>{t("secondary")}</Button>
        <Button variant="ghost" onClick={tryLoading}>{t("ghost")}</Button><Button variant="outline" onClick={tryLoading}>{t("outline")}</Button>
        <Button variant="destructive" onClick={tryLoading}><Trash2 />{t("destructive")}</Button>
        <Button size="icon" variant="outline" aria-label={t("add")} aria-pressed={liked} onClick={() => setLiked(!liked)}><Heart fill={liked ? "currentColor" : "none"} /></Button>
      </Row><p className="ds-helper" style={{ marginTop: 16 }}>{t("keyboardHint")}</p>
    </DemoPanel></Section>
    <Section title={t("states")}><DemoPanel><div className="ds-state-grid">{(["default", "hover", "pressed", "focus", "disabled", "loading"] as const).map((state) => <div className="ds-state-cell" key={state}>
      <span>{t(state)}</span><Button data-preview={state} disabled={state === "disabled"} loading={state === "loading"} onClick={tryLoading}>{t("primaryAction")}{state !== "loading" && <ArrowRight />}</Button>
    </div>)}</div></DemoPanel></Section>
    <Section title={t("sizes")}><DemoPanel><Row>
      <Button size="sm" onClick={tryLoading}><Plus />{t("small")}</Button><Button onClick={tryLoading}><Plus />{t("standard")}</Button><Button size="lg" onClick={tryLoading}><Plus />{t("large")}</Button>
    </Row></DemoPanel></Section>
    <Section title={t("loading")}><DemoPanel><Button loading={loading} onClick={tryLoading}>{loading ? t("saving") : t("saveDemo")}</Button><p className="ds-inline-status" role="status">{done ? t("savedDemo") : t("previewOnly")}</p></DemoPanel></Section>
    <Section title={t("bilingual")}><DemoPanel><Row><Button lang="en-CA" onClick={tryLoading}>{messages.add[0]}<ArrowRight /></Button><Button lang="fr-CA" onClick={tryLoading}>{messages.add[1]}<ArrowRight /></Button></Row></DemoPanel></Section>
    <Guidelines items={[{ kind: "do", text: t("buttonDo") }, { kind: "dont", text: t("buttonDont") }]} />
  </>;
}