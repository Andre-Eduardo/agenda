import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PatientAlertDto, UpdatePatientAlertDto} from '@application/patient-alert/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientAlertRepository} from '@domain/patient-alert/patient-alert.repository';

@Injectable()
export class UpdatePatientAlertService implements ApplicationService<UpdatePatientAlertDto, PatientAlertDto> {
    constructor(
        private readonly patientAlertRepository: PatientAlertRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdatePatientAlertDto>): Promise<PatientAlertDto> {
        const alert = await this.patientAlertRepository.findById(payload.alertId);

        if (alert === null) {
            throw new ResourceNotFoundException('Patient alert not found.', payload.alertId.toString());
        }

        alert.change({
            title: payload.title ?? undefined,
            description: payload.description ?? undefined,
            severity: payload.severity ?? undefined,
            isActive: payload.isActive ?? undefined,
        });

        await this.patientAlertRepository.save(alert);

        this.eventDispatcher.dispatch(actor, alert);

        return new PatientAlertDto(alert);
    }
}
