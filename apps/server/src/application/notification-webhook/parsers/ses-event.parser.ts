import {z} from 'zod';

export type SesDeliveryEvent = {
    /** SES message id: the `MessageId` that `SendEmail` returned. */
    sesMessageId: string;
    type: 'DELIVERED' | 'READ' | 'DELIVERY_FAILED' | 'COMPLAINED';
    occurredAt: Date;
    detail: string | null;
};

const timestamped = z.object({timestamp: z.string().optional()}).passthrough();

const sesEventSchema = z
    .object({
        // Configuration-set event publishing uses `eventType`; identity notifications use `notificationType`.
        eventType: z.string().optional(),
        notificationType: z.string().optional(),
        mail: z.object({messageId: z.string(), timestamp: z.string().optional()}).passthrough(),
        delivery: timestamped.optional(),
        open: timestamped.optional(),
        bounce: timestamped
            .extend({
                bounceType: z.string().optional(),
                bounceSubType: z.string().optional(),
                bouncedRecipients: z.array(z.object({diagnosticCode: z.string().optional()}).passthrough()).optional(),
            })
            .optional(),
        complaint: timestamped.extend({complaintFeedbackType: z.string().optional()}).optional(),
        reject: z.object({reason: z.string().optional()}).passthrough().optional(),
        failure: z.object({errorMessage: z.string().optional()}).passthrough().optional(),
    })
    .passthrough();

/**
 * Reads the SES event carried in an SNS notification's `Message`. Returns `null` for events that
 * do not change the reminder timeline (Send, Click, DeliveryDelay, ...).
 */
export function parseSesEvent(message: string, now: Date = new Date()): SesDeliveryEvent | null {
    let json: unknown;

    try {
        json = JSON.parse(message);
    } catch {
        return null;
    }

    const parsed = sesEventSchema.safeParse(json);

    if (!parsed.success) return null;

    const event = parsed.data;
    const kind = event.eventType ?? event.notificationType;
    const base = {sesMessageId: event.mail.messageId};
    const at = (value: string | undefined): Date => parseDate(value) ?? parseDate(event.mail.timestamp) ?? now;

    switch (kind ?? '') {
        case 'Delivery':
            return {...base, type: 'DELIVERED', occurredAt: at(event.delivery?.timestamp), detail: null};
        case 'Open':
            return {...base, type: 'READ', occurredAt: at(event.open?.timestamp), detail: null};
        case 'Bounce': {
            const {bounceType, bounceSubType, bouncedRecipients} = event.bounce ?? {};
            const diagnostic = bouncedRecipients?.find((recipient) => recipient.diagnosticCode)?.diagnosticCode;
            const detail = [`Bounce ${bounceType ?? 'Undetermined'}/${bounceSubType ?? 'Undetermined'}`, diagnostic]
                .filter(Boolean)
                .join(': ');

            return {...base, type: 'DELIVERY_FAILED', occurredAt: at(event.bounce?.timestamp), detail};
        }
        case 'Complaint':
            return {
                ...base,
                type: 'COMPLAINED',
                occurredAt: at(event.complaint?.timestamp),
                detail: event.complaint?.complaintFeedbackType ?? null,
            };
        case 'Reject':
            return {
                ...base,
                type: 'DELIVERY_FAILED',
                occurredAt: at(undefined),
                detail: `Rejected by SES: ${event.reject?.reason ?? 'unknown reason'}`,
            };
        case 'Rendering Failure':
            return {
                ...base,
                type: 'DELIVERY_FAILED',
                occurredAt: at(undefined),
                detail: `Rendering failure: ${event.failure?.errorMessage ?? 'unknown error'}`,
            };
        default:
            return null;
    }
}

function parseDate(value: string | undefined): Date | null {
    if (value === undefined) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}
