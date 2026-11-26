import type {ReminderChannel} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import type {ClinicId} from '@domain/clinic/entities';

export interface NotificationPayload {
    /** Clinic on whose behalf the message is sent (e.g. selects the WhatsApp instance). */
    clinicId: ClinicId;
    /** Destination: e-mail address for EMAIL, digits-only phone number for WHATSAPP/SMS. */
    to: string;
    /** Subject line. Used only by channels that support it (e-mail). */
    subject?: string;
    message: string;
    metadata?: Record<string, unknown>;
}

export interface NotificationResult {
    success: boolean;
    /** Message id assigned by the provider; status webhooks refer to it. */
    providerId?: string;
    /** Destination in the provider's format (e.g. WhatsApp number with country code). Defaults to `to`. */
    destination?: string;
    error?: string;
}

/**
 * Port for a delivery channel. Implementations must never throw for delivery problems:
 * they return `{success: false, error}` so the caller can record the failure and move on.
 */
export abstract class NotificationProvider {
    abstract readonly channel: ReminderChannel;
    abstract send(payload: NotificationPayload): Promise<NotificationResult>;
}
