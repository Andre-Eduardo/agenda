import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {PatientAlertDto} from '@application/patient-alert/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {PatientAlertId} from '@domain/patient-alert/entities';
import {PatientAlertRepository} from '@domain/patient-alert/patient-alert.repository';
import {PatientId} from '@domain/patient/entities';

type GetPatientAlertDto = {alertId: PatientAlertId; patientId: PatientId};

@Injectable()
export class GetPatientAlertService implements ApplicationService<GetPatientAlertDto, PatientAlertDto> {
    constructor(
        private readonly patientAlertRepository: PatientAlertRepository,
        private readonly patientAccessChecker: PatientAccessChecker
    ) {}

    async execute({actor, payload}: Command<GetPatientAlertDto>): Promise<PatientAlertDto> {
        const alert = await this.patientAlertRepository.findById(payload.alertId);

        if (alert === null || !alert.patientId.equals(payload.patientId)) {
            throw new ResourceNotFoundException('Patient alert not found.', payload.alertId.toString());
        }

        assertEntityBelongsToClinic(alert.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'read');

        return new PatientAlertDto(alert);
    }
}
