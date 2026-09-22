import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { usePreferences } from "../../hooks/use-preferences";
import { useFeedbackMessages } from "../../lib/messages-feedback";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

export default function AlertDemo() {
  usePreferences();
  const { tf } = useFeedbackMessages();
  const [dismissed, setDismissed] = useState(false);
  const [note, setNote] = useState("");

  return (
    <>
      <PageHeader eyebrow={tf("eyebrow")} title={tf("alertTitle")} description={tf("alertIntro")} />

      <Section title={tf("variants")}>
        <DemoPanel>
          <Stack>
            <Alert variant="neutral" icon={<Info />}>
              <AlertTitle>{tf("alertNeutralTitle")}</AlertTitle>
              <AlertDescription>{tf("alertNeutralBody")}</AlertDescription>
            </Alert>
            <Alert variant="success" icon={<CheckCircle2 />}>
              <AlertTitle>{tf("alertSuccessTitle")}</AlertTitle>
              <AlertDescription>{tf("alertSuccessBody")}</AlertDescription>
            </Alert>
            <Alert variant="warning" icon={<AlertTriangle />}>
              <AlertTitle>{tf("alertWarningTitle")}</AlertTitle>
              <AlertDescription>{tf("alertWarningBody")}</AlertDescription>
            </Alert>
            <Alert variant="error" role="alert" icon={<XCircle />}>
              <AlertTitle>{tf("alertErrorTitle")}</AlertTitle>
              <AlertDescription>{tf("alertErrorBody")}</AlertDescription>
            </Alert>
          </Stack>
        </DemoPanel>
      </Section>

      <Section title={tf("withActionTitle")}>
        <DemoPanel>
          <Alert
            variant="error"
            role="alert"
            icon={<XCircle />}
            action={<Button variant="outline" size="sm" onClick={() => setNote(tf("stateRetried"))}>{tf("retry")}</Button>}
          >
            <AlertTitle>{tf("alertErrorTitle")}</AlertTitle>
            <AlertDescription>{tf("alertErrorBody")}</AlertDescription>
          </Alert>
          <p className="ds-inline-status" role="status">{note || tf("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={tf("dismissibleTitle")}>
        <DemoPanel>
          {dismissed ? (
            <Button variant="outline" onClick={() => setDismissed(false)}>{tf("reset")}</Button>
          ) : (
            <Alert
              variant="warning"
              icon={<AlertTriangle />}
              action={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={tf("dismiss")}
                  onClick={() => setDismissed(true)}
                >
                  <X />
                </Button>
              }
            >
              <AlertTitle>{tf("alertWarningTitle")}</AlertTitle>
              <AlertDescription>{tf("alertWarningBody")}</AlertDescription>
            </Alert>
          )}
          <p className="ds-inline-status" role="status">{dismissed ? tf("bannerDismissed") : tf("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tf("alertDo") }, { kind: "dont", text: tf("alertDont") }]} />
    </>
  );
}
