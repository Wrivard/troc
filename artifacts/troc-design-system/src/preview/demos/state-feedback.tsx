import { useState } from "react";
import { CheckCircle2, Inbox, SearchX, WifiOff } from "lucide-react";
import { EmptyState, ErrorState, StateFeedback, SuccessState } from "../../components/ui/state-feedback";
import { usePreferences } from "../../hooks/use-preferences";
import { useFeedbackMessages } from "../../lib/messages-feedback";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

export default function StateFeedbackDemo() {
  usePreferences();
  const { tf } = useFeedbackMessages();
  const [note, setNote] = useState("");

  return (
    <>
      <PageHeader eyebrow={tf("eyebrow")} title={tf("stateTitle")} description={tf("stateIntro")} />

      <Section title={tf("fullTitle")}>
        <DemoPanel>
          <Stack>
            <EmptyState
              icon={<Inbox />}
              title={tf("emptyTitle")}
              description={tf("emptyBody")}
              primaryAction={{ label: tf("emptyPrimary"), onClick: () => setNote(tf("stateActioned")) }}
              secondaryAction={{ label: tf("emptySecondary"), onClick: () => setNote(tf("stateActioned")) }}
            />
            <ErrorState
              icon={<WifiOff />}
              title={tf("errorTitle")}
              description={tf("errorBody")}
              primaryAction={{ label: tf("retry"), onClick: () => setNote(tf("stateRetried")) }}
            />
            <SuccessState
              icon={<CheckCircle2 />}
              title={tf("successTitle")}
              description={tf("successBody")}
              primaryAction={{ label: tf("successPrimary"), onClick: () => setNote(tf("stateActioned")) }}
              secondaryAction={{ label: tf("successSecondary"), onClick: () => setNote(tf("stateActioned")) }}
            />
          </Stack>
          <p className="ds-inline-status" role="status">{note || tf("stateDemoNeutral")}</p>
        </DemoPanel>
      </Section>

      <Section title={tf("compactTitle")}>
        <DemoPanel>
          <Stack>
            <StateFeedback
              variant="empty"
              format="compact"
              icon={<SearchX />}
              title={tf("emptyCompact")}
              primaryAction={{ label: tf("clearFilters"), onClick: () => setNote(tf("stateActioned")) }}
            />
            <StateFeedback
              variant="error"
              format="compact"
              icon={<WifiOff />}
              title={tf("errorCompact")}
              primaryAction={{ label: tf("retry"), onClick: () => setNote(tf("stateRetried")) }}
            />
            <StateFeedback
              variant="success"
              format="compact"
              icon={<CheckCircle2 />}
              title={tf("successCompact")}
            />
          </Stack>
          <p className="ds-helper" style={{ marginTop: 16 }}>{tf("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tf("stateDo") }, { kind: "dont", text: tf("stateDont") }]} />
    </>
  );
}
