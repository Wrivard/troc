import { api } from "../../api";
type Metric = { id: string; event: string; data: Record<string, number> };
let sending = false;
const key = "troc.commerce.metrics.v1";
export function trackCommerce(event: string, data: Record<string, number>) {
  try {
    const queue: Metric[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    queue.push({ id: crypto.randomUUID(), event, data });
    localStorage.setItem(key, JSON.stringify(queue.slice(-100)));
    void flushCommerceMetrics();
  } catch {
    /* Analytics never prevent shopping. */
  }
}
export async function flushCommerceMetrics() {
  if (sending) return;
  sending = true;
  try {
    const queue: Metric[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!queue.length) return;
    await api("/commerce/events", "POST", { events: queue });
    const sent = new Set(queue.map((e) => e.id));
    const current: Metric[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    localStorage.setItem(
      key,
      JSON.stringify(current.filter((e) => !sent.has(e.id))),
    );
  } catch {
    /* Retry on the next commerce interaction; queue remains bounded. */
  } finally {
    sending = false;
  }
}
