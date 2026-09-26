/** Pure dry-run decisions for a future receipt-backed worker. No queue, DB or transport side effects.
 * All fields must come from locked server-side records, never a request body.
 */
export type EmailReceiptSnapshot = {
  source: "simulation" | "live";
  state: "pending" | "attempted" | "accepted" | "dead";
  payloadDigest: string;
  attemptedPayloadDigest?: string;
  firstAttemptAt?: number;
  providerMessageId?: string;
  attempts: number;
};
export type EmailRecoveryDecision =
  | "blocked_source"
  | "invalid_receipt"
  | "already_accepted"
  | "dead_letter"
  | "reconcile"
  | "first_attempt"
  | "retry_same_request";
// Resend documents 24h retention. Reserve one hour for timing/transit uncertainty.
const SAFE_RETRY_AGE_MS = 23 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const digest = /^[a-f0-9]{64}$/;
/** A decision is not a send authorization. Claim/fence/persist-before-send checks remain mandatory. */
export function planEmailRecovery(
  receipt: EmailReceiptSnapshot,
  now: number,
  liveSourceApproved = false,
): EmailRecoveryDecision {
  if (receipt.source !== "live" || liveSourceApproved !== true)
    return "blocked_source";
  if (
    !Number.isSafeInteger(now) ||
    now < 0 ||
    !Number.isSafeInteger(receipt.attempts) ||
    receipt.attempts < 0 ||
    typeof receipt.payloadDigest !== "string" ||
    !digest.test(receipt.payloadDigest)
  )
    return "invalid_receipt";
  if (receipt.state === "accepted")
    return typeof receipt.providerMessageId === "string" &&
      receipt.providerMessageId.trim().length > 0
      ? "already_accepted"
      : "invalid_receipt";
  if (receipt.state === "dead") return "dead_letter";
  if (receipt.state === "pending")
    return receipt.attempts === 0 &&
      receipt.firstAttemptAt === undefined &&
      receipt.attemptedPayloadDigest === undefined &&
      receipt.providerMessageId === undefined
      ? "first_attempt"
      : "invalid_receipt";
  if (
    receipt.state !== "attempted" ||
    receipt.attempts < 1 ||
    !Number.isSafeInteger(receipt.firstAttemptAt) ||
    receipt.firstAttemptAt! < 0 ||
    receipt.firstAttemptAt! > now ||
    receipt.providerMessageId !== undefined ||
    typeof receipt.attemptedPayloadDigest !== "string" ||
    !digest.test(receipt.attemptedPayloadDigest)
  )
    return "invalid_receipt";
  if (
    receipt.attemptedPayloadDigest !== receipt.payloadDigest ||
    now - receipt.firstAttemptAt! >= SAFE_RETRY_AGE_MS
  )
    return "reconcile";
  if (receipt.attempts >= MAX_ATTEMPTS) return "reconcile";
  return "retry_same_request";
}
