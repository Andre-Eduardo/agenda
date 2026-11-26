/**
 * Automatic resend of a failed attempt (L2-04). The first attempt plus one retry per delay:
 * 3 attempts at most, 15 and 60 minutes apart. A retry never goes past the appointment start,
 * since a reminder after the fact is useless.
 */
export const REMINDER_RETRY_DELAYS_MINUTES = [15, 60] as const;

export const REMINDER_MAX_ATTEMPTS = REMINDER_RETRY_DELAYS_MINUTES.length + 1;

/**
 * When to try again after the attempt number `attempt` (1-based) failed at `failedAt`, or `null`
 * when the failure is final.
 */
export function nextReminderRetryAt(attempt: number, failedAt: Date, appointmentStartAt: Date): Date | null {
    const delayMinutes = REMINDER_RETRY_DELAYS_MINUTES[attempt - 1];

    if (delayMinutes === undefined) return null;

    const retryAt = new Date(failedAt.getTime() + delayMinutes * 60_000);

    return retryAt < appointmentStartAt ? retryAt : null;
}
