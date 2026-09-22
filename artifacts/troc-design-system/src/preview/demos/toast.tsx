import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Toaster, ToastControllerProvider, useToast, type ToastData } from "../../components/ui/toast";
import { usePreferences } from "../../hooks/use-preferences";
import { useFeedbackMessages } from "../../lib/messages-feedback";
import { DemoPanel, Guidelines, PageHeader, Row, Section } from "../parts";

function ToastTriggers() {
  const { t } = usePreferences();
  const { tf } = useFeedbackMessages();
  const { toast } = useToast();
  const [note, setNote] = useState("");

  const show = (data: Omit<ToastData, "id">) => {
    setNote("");
    toast(data);
  };

  return (
    <>
      <Row>
        <Button variant="outline" onClick={() => show({ variant: "neutral", title: tf("toastNeutralTitle"), description: tf("toastNeutralBody") })}>
          <Bell />{tf("showNeutral")}
        </Button>
        <Button variant="outline" onClick={() => show({ variant: "success", title: tf("toastSuccessTitle"), description: tf("toastSuccessBody") })}>
          <CheckCircle2 />{tf("showSuccess")}
        </Button>
        <Button variant="outline" onClick={() => show({ variant: "warning", title: tf("toastWarningTitle"), description: tf("toastWarningBody") })}>
          <AlertTriangle />{tf("showWarning")}
        </Button>
        <Button variant="outline" onClick={() => show({ variant: "error", title: tf("toastErrorTitle"), description: tf("toastErrorBody") })}>
          <XCircle />{tf("showError")}
        </Button>
        <Button onClick={() => show({
          variant: "neutral",
          title: tf("toastActionTitle"),
          description: tf("toastActionBody"),
          actionLabel: tf("undo"),
          onAction: () => setNote(tf("toastUndone")),
        })}>{tf("showAction")}</Button>
      </Row>
      <p className="ds-inline-status" role="status">{note || tf("toastNote")}</p>
      <p className="ds-helper" style={{ marginTop: 8 }}>{tf("demoOnly")}</p>
      <Toaster closeLabel={tf("close")} />
    </>
  );
}

export default function ToastDemo() {
  const { tf } = useFeedbackMessages();
  return (
    <>
      <PageHeader eyebrow={tf("eyebrow")} title={tf("toastTitle")} description={tf("toastIntro")} />
      <Section title={tf("triggersTitle")}>
        <DemoPanel>
          <ToastControllerProvider>
            <ToastTriggers />
          </ToastControllerProvider>
        </DemoPanel>
      </Section>
      <Guidelines items={[{ kind: "do", text: tf("toastDo") }, { kind: "dont", text: tf("toastDont") }]} />
    </>
  );
}
