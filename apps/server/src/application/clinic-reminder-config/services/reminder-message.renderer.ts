import {Injectable} from '@nestjs/common';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicReminderConfigRepository} from '@domain/clinic-reminder-config/clinic-reminder-config.repository';
import {
    DEFAULT_REMINDER_MESSAGE_TEMPLATE,
    formatReminderDate,
    formatReminderTime,
    renderReminderMessage,
} from '@domain/clinic-reminder-config/reminder-message-template';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import type {ClinicId} from '@domain/clinic/entities';
import {UserRepository} from '@domain/user/user.repository';

export type ReminderMessageInput = {
    clinicId: ClinicId;
    patientName: string;
    startAt: Date;
    professionalId: ClinicMemberId;
};

/** Turns the clinic's reminder text into the message a patient receives (dispatch and preview). */
@Injectable()
export class ReminderMessageRenderer {
    constructor(
        private readonly configRepository: ClinicReminderConfigRepository,
        private readonly clinicRepository: ClinicRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly userRepository: UserRepository
    ) {}

    /** Renders with the template saved by the clinic (or the default one). */
    async render(input: ReminderMessageInput): Promise<string> {
        const config = await this.configRepository.findByClinicId(input.clinicId);

        return this.renderTemplate(config?.resolveMessageTemplate() ?? DEFAULT_REMINDER_MESSAGE_TEMPLATE, input);
    }

    async renderTemplate(template: string, input: ReminderMessageInput): Promise<string> {
        const [clinicName, professionalName] = await Promise.all([
            this.clinicName(input.clinicId),
            this.professionalName(input.professionalId),
        ]);

        return renderReminderMessage(template, {
            paciente: input.patientName,
            data: formatReminderDate(input.startAt),
            hora: formatReminderTime(input.startAt),
            profissional: professionalName,
            clinica: clinicName,
        });
    }

    private async clinicName(clinicId: ClinicId): Promise<string> {
        const clinic = await this.clinicRepository.findById(clinicId);

        return clinic?.name ?? 'a clínica';
    }

    private async professionalName(memberId: ClinicMemberId): Promise<string> {
        const member = await this.clinicMemberRepository.findById(memberId);

        if (member === null) return 'o profissional';

        if (member.displayName) return member.displayName;

        const user = await this.userRepository.findById(member.userId);

        return user?.name ?? 'o profissional';
    }
}
