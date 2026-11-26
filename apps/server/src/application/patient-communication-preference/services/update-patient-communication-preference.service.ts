import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {
    PatientCommunicationPreferencesDto,
    type UpdatePatientCommunicationPreferenceDto,
} from '@application/patient-communication-preference/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {currentPreferences} from '@domain/patient-communication-preference/communication-preferences';
import {
    CommunicationPreferenceSource,
    PatientCommunicationPreferenceChange,
} from '@domain/patient-communication-preference/entities';
import {PatientCommunicationPreferenceRepository} from '@domain/patient-communication-preference/patient-communication-preference.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

/**
 * A clinic member records the patient's choice for one channel. Every call appends a change,
 * even when the value is the same, because each request of the patient is evidence (LGPD).
 */
@Injectable()
export class UpdatePatientCommunicationPreferenceService implements ApplicationService<
    UpdatePatientCommunicationPreferenceDto,
    PatientCommunicationPreferencesDto
> {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly preferenceRepository: PatientCommunicationPreferenceRepository,
        private readonly patientAccessChecker: PatientAccessChecker
    ) {}

    async execute({
        actor,
        payload,
    }: Command<UpdatePatientCommunicationPreferenceDto>): Promise<PatientCommunicationPreferencesDto> {
        const patient = await this.patientRepository.findById(payload.patientId, actor.clinicId);

        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'register');

        await this.preferenceRepository.recordIfAbsent(
            PatientCommunicationPreferenceChange.record({
                clinicId: actor.clinicId,
                patientId: payload.patientId,
                channel: payload.channel,
                optedOut: payload.optedOut,
                source: CommunicationPreferenceSource.STAFF,
                changedByMemberId: actor.clinicMemberId,
                reason: payload.reason ?? null,
                occurredAt: new Date(),
            })
        );

        const history = await this.preferenceRepository.findHistory(actor.clinicId, payload.patientId);

        return new PatientCommunicationPreferencesDto(
            payload.patientId.toString(),
            currentPreferences(history),
            history
        );
    }
}
