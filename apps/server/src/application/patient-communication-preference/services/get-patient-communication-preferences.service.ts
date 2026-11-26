import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {
    type GetPatientCommunicationPreferencesDto,
    PatientCommunicationPreferencesDto,
} from '@application/patient-communication-preference/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {currentPreferences} from '@domain/patient-communication-preference/communication-preferences';
import {PatientCommunicationPreferenceRepository} from '@domain/patient-communication-preference/patient-communication-preference.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class GetPatientCommunicationPreferencesService
    implements ApplicationService<GetPatientCommunicationPreferencesDto, PatientCommunicationPreferencesDto>
{
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly preferenceRepository: PatientCommunicationPreferenceRepository,
        private readonly patientAccessChecker: PatientAccessChecker
    ) {}

    async execute({
        actor,
        payload,
    }: Command<GetPatientCommunicationPreferencesDto>): Promise<PatientCommunicationPreferencesDto> {
        const patient = await this.patientRepository.findById(payload.patientId, actor.clinicId);

        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'basic');

        const history = await this.preferenceRepository.findHistory(actor.clinicId, payload.patientId);

        return new PatientCommunicationPreferencesDto(
            payload.patientId.toString(),
            currentPreferences(history),
            history
        );
    }
}
