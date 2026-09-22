import { useState } from "react";
import { NotificationItem, type NotificationTone } from "../../components/ui/notification-item";
import { Button } from "../../components/ui/button";
import { useMarketCardMessages } from "../../lib/messages-market-cards";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

type DemoRow = {
  id: string;
  tone: NotificationTone;
  titleKey: Parameters<ReturnType<typeof useMarketCardMessages>["ts"]>[0];
  bodyKey: Parameters<ReturnType<typeof useMarketCardMessages>["ts"]>[0];
  timeKey: Parameters<ReturnType<typeof useMarketCardMessages>["ts"]>[0];
  withAction?: boolean;
};

const ROWS: DemoRow[] = [
  { id: "info", tone: "info", titleKey: "niInfoTitle", bodyKey: "niInfoBody", timeKey: "niTimeNow", withAction: true },
  { id: "success", tone: "success", titleKey: "niSuccessTitle", bodyKey: "niSuccessBody", timeKey: "niTime5m" },
  { id: "warning", tone: "warning", titleKey: "niWarningTitle", bodyKey: "niWarningBody", timeKey: "niTime1h" },
  { id: "error", tone: "error", titleKey: "niErrorTitle", bodyKey: "niErrorBody", timeKey: "niTime1d" },
];

export default function NotificationItemDemo() {
  const { ts } = useMarketCardMessages();
  // Local-only read state; toggling never persists or calls a backend.
  const [read, setRead] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setRead((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <PageHeader eyebrow={ts("eyebrow")} title={ts("niTitle")} description={ts("niIntro")} />

      <Section title={ts("niTonesTitle")}>
        <DemoPanel>
          <ul aria-label={ts("niTitle")} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, maxWidth: 560 }}>
            {ROWS.map((row) => {
              const isUnread = !read[row.id];
              return (
                <li key={row.id}>
                  <NotificationItem
                    tone={row.tone}
                    unread={isUnread}
                    statusLabel={isUnread ? ts("niUnread") : ts("niRead")}
                    title={ts(row.titleKey)}
                    message={ts(row.bodyKey)}
                    timestamp={ts(row.timeKey)}
                    actions={
                      <>
                        {row.withAction ? (
                          <Button variant="secondary" size="sm">{ts("niViewOffers")}</Button>
                        ) : null}
                        <Button variant="ghost" size="sm" onClick={() => toggle(row.id)}>
                          {isUnread ? ts("niMarkRead") : ts("niMarkUnread")}
                        </Button>
                      </>
                    }
                  />
                </li>
              );
            })}
          </ul>
          <p className="ds-helper" style={{ marginTop: 12 }}>{ts("niToggleNote")}</p>
        </DemoPanel>
      </Section>

      <Section title={ts("states")}>
        <DemoPanel>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
            <Stack label={ts("niRead")}>
              <NotificationItem
                tone="info"
                unread={false}
                statusLabel={ts("niRead")}
                title={ts("niInfoTitle")}
                message={ts("niInfoBody")}
                timestamp={ts("niTime1h")}
              />
            </Stack>
            <Stack label={ts("niCompact")}>
              <NotificationItem
                compact
                tone="success"
                unread
                statusLabel={ts("niUnread")}
                title={ts("niSuccessTitle")}
                timestamp={ts("niTime5m")}
              />
            </Stack>
            <Stack label={ts("ppFocus")}>
              <NotificationItem
                previewState="focus"
                tone="warning"
                unread
                statusLabel={ts("niUnread")}
                title={ts("niWarningTitle")}
                message={ts("niWarningBody")}
                timestamp={ts("niTime1h")}
                actions={<Button variant="secondary" size="sm">{ts("niViewOffers")}</Button>}
              />
            </Stack>
          </div>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: ts("niDo") }, { kind: "dont", text: ts("niDont") }]} />
    </>
  );
}
