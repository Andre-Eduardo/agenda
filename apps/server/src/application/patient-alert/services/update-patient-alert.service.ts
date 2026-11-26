import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {PatientAlertDto, UpdatePatientAlertDto} from '@application/patient-alert/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientAlertRepository} from '@domain/patient-alert/patient-alert.repository';

@Injectable()
export class UpdatePatientAlertService implements ApplicationService<UpdatePatientAlertDto, PatientAlertDto> {
    constructor(
        private readonly patientAlertRepository: PatientAlertRepository,
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdatePatientAlertDto>): Promise<PatientAlertDto> {
        const alert = await this.patientAlertRepository.findById(payload.alertId);

        if (alert === null || !alert.patientId.equals(payload.patientId)) {
            throw new ResourceNotFoundException('Patient alert not found.', payload.alertId.toString());
        }

        assertEntityBelongsToClinic(alert.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'write');

        alert.change({
            title: payload.title ?? undefined,
            description: payload.description,
            severity: payload.severity ?? undefined,
            isActive: payload.isActive ?? undefined,
        });

        await this.patientAlertRepository.save(alert);

        this.eventDispatcher.dispatch(actor, alert);

        return new PatientAlertDto(alert);
    }
}
