import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientAlertId} from '@domain/patient-alert/entities';
import {PatientAlertRepository} from '@domain/patient-alert/patient-alert.repository';
import {PatientId} from '@domain/patient/entities';

type DeletePatientAlertDto = {alertId: PatientAlertId; patientId: PatientId};

@Injectable()
export class DeletePatientAlertService implements ApplicationService<DeletePatientAlertDto> {
    constructor(
        private readonly patientAlertRepository: PatientAlertRepository,
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeletePatientAlertDto>): Promise<void> {
        const alert = await this.patientAlertRepository.findById(payload.alertId);

        if (alert === null || !alert.patientId.equals(payload.patientId)) {
            throw new ResourceNotFoundException('Patient alert not found.', payload.alertId.toString());
        }

        assertEntityBelongsToClinic(alert.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'write');

        alert.delete();

        await this.patientAlertRepository.delete(alert.id);

        this.eventDispatcher.dispatch(actor, alert);
    }
}
