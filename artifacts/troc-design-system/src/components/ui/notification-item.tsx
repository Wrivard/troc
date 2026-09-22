"use client"

import * as React from "react"
import { AlertTriangle, Bell, CheckCircle2, Info, XCircle } from "lucide-react"

import { cn } from "../../lib/utils"

export type NotificationTone = "info" | "success" | "warning" | "error"

const TONE_ICON: Record<NotificationTone, React.ComponentType<{ "aria-hidden"?: boolean }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

/**
 * A single notification list item. Tone is conveyed by an icon plus the
 * caller's copy — never colour alone. Read/unread is a visual state supplied by
 * the caller; toggling it is the consumer's responsibility (see the demo, which
 * toggles local state). An optional action slot renders sibling controls. All
 * copy is translated by the caller.
 */
export interface NotificationItemProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Semantic tone. */
  tone?: NotificationTone
  /** Whether the notification is unread. */
  unread?: boolean
  /** Translated title. */
  title: React.ReactNode
  /** Translated body message (hidden in compact size). */
  message?: React.ReactNode
  /** Translated relative timestamp, e.g. "5 min ago". */
  timestamp?: string
  /**
   * Visually-hidden translated status word ("Unread"/"Read") so read state is
   * available to assistive tech, not just the dot.
   */
  statusLabel: string
  /** Optional sibling action controls (buttons, links). */
  actions?: React.ReactNode
  /** Custom leading icon; defaults to a tone icon. */
  icon?: React.ReactNode
  /** Compact size hides the body message. */
  compact?: boolean
  /** Force a static preview state for the style guide. */
  previewState?: "focus"
}

const NotificationItem = React.forwardRef<HTMLElement, NotificationItemProps>(
  (
    { className, tone = "info", unread = false, title, message, timestamp, statusLabel, actions, icon, compact = false, previewState, ...props },
    ref
  ) => {
    const ToneIcon = TONE_ICON[tone] ?? Bell

    return (
      <article
        ref={ref}
        className={cn("troc-notification", `troc-notification--${tone}`, compact && "troc-notification--compact", className)}
        data-unread={unread}
        data-preview={previewState}
        aria-label={statusLabel}
        {...props}
      >
        <span className="troc-notification-dot" aria-hidden="true" />
        <span className="troc-notification-icon">
          {icon ?? <ToneIcon aria-hidden={true} />}
        </span>
        <div className="troc-notification-body">
          <div className="troc-notification-head">
            <h3 className="troc-notification-title">{title}</h3>
            {timestamp ? <span className="troc-notification-time">{timestamp}</span> : null}
          </div>
          {message && !compact ? (
            <p className="troc-notification-message">{message}</p>
          ) : null}
          {actions ? <div className="troc-notification-actions">{actions}</div> : null}
        </div>
      </article>
    )
  }
)
NotificationItem.displayName = "NotificationItem"

export { NotificationItem }
