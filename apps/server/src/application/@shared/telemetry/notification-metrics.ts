/**
 * Names of the notification metrics. The OTLP → Prometheus translation turns dots into
 * underscores and adds `_total` to counters (`notification.reminder.attempt` →
 * `notification_reminder_attempt_total`); `infra/grafana` queries those names.
 */
export const NotificationMetric = {
    /** Counter. Attributes: `channel`, `outcome` (`sent` | `failed` | `retry`). */
    ATTEMPT: 'notification.reminder.attempt',
    /** Histogram, milliseconds. Attributes: `channel`, `outcome`. */
    SEND_DURATION: 'notification.provider.send.duration_ms',
    /** Counter. Attributes: `source` (`evolution` | `ses`), `result`. */
    WEBHOOK: 'notification.webhook.received',
    /** Counter. Attributes: `channel`, `type` (a `ReminderEventType` from a webhook). */
    STATUS: 'notification.reminder.status',
    /** Gauge: pending reminders whose time passed more than 15 minutes ago (stuck queue). */
    OVERDUE: 'notification.reminders.overdue',
} as const;

export type WebhookResult = 'applied' | 'duplicate' | 'ignored' | 'unmatched' | 'unauthorized' | 'invalid';
