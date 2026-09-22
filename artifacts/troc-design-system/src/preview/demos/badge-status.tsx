import type { ReactNode } from "react";
import { BadgeCheck, Clock, PackageCheck, Sparkles, Truck, XCircle } from "lucide-react";
import { Badge, OrderStatusBadge, type OrderStatus } from "../../components/ui/badge-status";
import { usePreferences } from "../../hooks/use-preferences";
import { useControlsMessages, type ControlsMessageKey } from "../../lib/messages-controls";
import { DemoPanel, Guidelines, PageHeader, Row, Section } from "../parts";

const statuses: { status: OrderStatus; key: ControlsMessageKey; icon: ReactNode }[] = [
  { status: "pending", key: "statusPending", icon: <Clock aria-hidden="true" size={14} /> },
  { status: "processing", key: "statusProcessing", icon: <PackageCheck aria-hidden="true" size={14} /> },
  { status: "shipped", key: "statusShipped", icon: <Truck aria-hidden="true" size={14} /> },
  { status: "delivered", key: "statusDelivered", icon: <BadgeCheck aria-hidden="true" size={14} /> },
  { status: "cancelled", key: "statusCancelled", icon: <XCircle aria-hidden="true" size={14} /> },
];

export default function BadgeStatusDemo() {
  usePreferences();
  const { tc } = useControlsMessages();
  return <>
    <PageHeader eyebrow={tc("badgeEyebrow")} title={tc("badgeTitle")} description={tc("badgeIntro")} />

    <Section title={tc("badgeVariantsTitle")}><DemoPanel>
      <Row>
        <Badge variant="neutral">{tc("neutral")}</Badge>
        <Badge variant="accent">{tc("accent")}</Badge>
        <Badge variant="positive"><BadgeCheck aria-hidden="true" />{tc("verified")}</Badge>
        <Badge variant="warning"><Clock aria-hidden="true" />{tc("lowStock")}</Badge>
        <Badge variant="destructive"><XCircle aria-hidden="true" />{tc("soldOut")}</Badge>
        <Badge variant="sponsored">{tc("sponsored")}</Badge>
        <Badge variant="outline"><Sparkles aria-hidden="true" />{tc("new")}</Badge>
      </Row>
      <p className="ds-helper" style={{ marginTop: 12 }}>{tc("statusNote")}</p>
    </DemoPanel></Section>

    <Section title={tc("orderStatusTitle")}><DemoPanel>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {statuses.map((item) => (
          <OrderStatusBadge key={item.status} status={item.status} label={tc(item.key)} icon={item.icon} />
        ))}
      </div>
      <p className="ds-helper" style={{ marginTop: 16 }}>{tc("demoOnly")}</p>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tc("badgeDo") }, { kind: "dont", text: tc("badgeDont") }]} />
  </>;
}
