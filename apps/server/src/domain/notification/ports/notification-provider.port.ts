import type {ReminderChannel} from '../../appointment-reminder/entities/appointment-reminder.entity';

export interface NotificationPayload {
    to: string;
    message: string;
    metadata?: Record<string, unknown>;
}

export interface NotificationResult {
    success: boolean;
    providerId?: string;
    error?: string;
}

export abstract class NotificationProvider {
    abstract readonly channel: ReminderChannel;
    abstract send(payload: NotificationPayload): Promise<NotificationResult>;
}
