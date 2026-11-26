import {Injectable, Logger} from '@nestjs/common';
import type {AppointmentReminder} from '@domain/appointment-reminder/entities';
import {
    type CommunicationPreferenceSource,
    PatientCommunicationPreferenceChange,
} from '@domain/patient-communication-preference/entities';
import {PatientCommunicationPreferenceRepository} from '@domain/patient-communication-preference/patient-communication-preference.repository';

export type RecordPatientOptOut = {
    /** The reminder the patient reacted to: it names the clinic, the patient and the channel. */
    reminder: AppointmentReminder;
    source: CommunicationPreferenceSource;
    /** Idempotency key from the provider (message id), so a webhook retry records nothing new. */
    externalId: string;
    occurredAt: Date;
    reason: string | null;
};

/** Opt-out the patient expressed directly to a provider (WhatsApp reply, spam complaint). */
@Injectable()
export class RecordPatientOptOutService {
    private readonly logger = new Logger(RecordPatientOptOutService.name);

    constructor(private readonly preferenceRepository: PatientCommunicationPreferenceRepository) {}

    async record({reminder, source, externalId, occurredAt, reason}: RecordPatientOptOut): Promise<boolean> {
        const recorded = await this.preferenceRepository.recordIfAbsent(
            PatientCommunicationPreferenceChange.record({
                clinicId: reminder.clinicId,
                patientId: reminder.patientId,
                channel: reminder.channel,
                optedOut: true,
                source,
                externalId,
                occurredAt,
                reason,
            })
        );

        if (recorded) {
            this.logger.log(
                `Patient ${reminder.patientId.toString()} opted out of ${reminder.channel} (${source}) ` +
                    `in clinic ${reminder.clinicId.toString()}`
            );
        }

        return recorded;
    }
}
