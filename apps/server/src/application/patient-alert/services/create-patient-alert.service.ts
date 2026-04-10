import {Injectable} from '@nestjs/common';
import {PatientAlert} from '../../../domain/patient-alert/entities';
import {PatientAlertRepository} from '../../../domain/patient-alert/patient-alert.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreatePatientAlertDto, PatientAlertDto} from '../dtos';

@Injectable()
export class CreatePatientAlertService implements ApplicationService<CreatePatientAlertDto, PatientAlertDto> {
    constructor(
        private readonly patientAlertRepository: PatientAlertRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreatePatientAlertDto>): Promise<PatientAlertDto> {
        const alert = PatientAlert.create({
            patientId: payload.patientId,
            professionalId: payload.professionalId,
            title: payload.title,
            description: payload.description ?? null,
            severity: payload.severity,
            isActive: payload.isActive,
        });

        await this.patientAlertRepository.save(alert);

        this.eventDispatcher.dispatch(actor, alert);

        return new PatientAlertDto(alert);
    }
}
