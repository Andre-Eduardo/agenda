import * as crypto from 'crypto';
import type {ClinicId} from '@domain/clinic/entities';

/** Header Evolution sends back on every webhook call (set when the webhook is registered). */
export const EVOLUTION_WEBHOOK_TOKEN_HEADER = 'x-agenda-whatsapp-token';

/**
 * Per-clinic webhook token: HMAC-SHA256 of the clinic id with `EVOLUTION_WEBHOOK_SECRET`.
 * Same scheme as plexter. A leaked token only lets someone post events for that one clinic, and
 * rotating the secret invalidates every token at once.
 */
export function signEvolutionWebhookToken(secret: string, clinicId: ClinicId): string {
    return crypto.createHmac('sha256', secret).update(clinicId.toString()).digest('hex');
}

export function verifyEvolutionWebhookToken(secret: string, clinicId: ClinicId, token: string | undefined): boolean {
    if (token === undefined || token === '') return false;

    const expected = Buffer.from(signEvolutionWebhookToken(secret, clinicId));
    const received = Buffer.from(token);

    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
