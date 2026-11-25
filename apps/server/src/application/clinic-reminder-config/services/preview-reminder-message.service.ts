import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {
    PreviewReminderMessageDto,
    ReminderMessagePreviewDto,
} from '@application/clinic-reminder-config/dtos/clinic-reminder-config.dto';
import {ReminderMessageRenderer} from '@application/clinic-reminder-config/services/reminder-message.renderer';
import {
    DEFAULT_REMINDER_MESSAGE_TEMPLATE,
    REMINDER_SUBJECT,
} from '@domain/clinic-reminder-config/reminder-message-template';
import type {ClinicId} from '@domain/clinic/entities';

export type PreviewReminderMessageCommand = PreviewReminderMessageDto & {clinicId: ClinicId};

export const PREVIEW_PATIENT_NAME = 'Maria Silva';

/**
 * Fills a (possibly unsaved) reminder text with sample data: a fictitious patient, the next day
 * at 14:30, the actor as the professional and the real clinic name. Nothing is sent or saved.
 */
@Injectable()
export class PreviewReminderMessageService implements ApplicationService<
    PreviewReminderMessageCommand,
    ReminderMessagePreviewDto
> {
    constructor(private readonly renderer: ReminderMessageRenderer) {}

    async execute({actor, payload}: Command<PreviewReminderMessageCommand>): Promise<ReminderMessagePreviewDto> {
        assertEntityBelongsToClinic(payload.clinicId, actor.clinicId);

        const custom = payload.messageTemplate?.trim() ?? '';
        const template = custom.length > 0 ? custom : DEFAULT_REMINDER_MESSAGE_TEMPLATE;
        const message = await this.renderer.renderTemplate(template, {
            clinicId: payload.clinicId,
            patientName: PREVIEW_PATIENT_NAME,
            startAt: sampleAppointmentStart(new Date()),
            professionalId: actor.clinicMemberId,
        });

        return new ReminderMessagePreviewDto(REMINDER_SUBJECT, message);
    }
}

/** Tomorrow at 14:30 in Brasília (UTC-3). */
function sampleAppointmentStart(now: Date): Date {
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    start.setUTCHours(17, 30, 0, 0);

    return start;
}
