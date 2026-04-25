import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {PatientAlert} from '../../../domain/patient-alert/entities';
import {PatientAlertRepository} from '../../../domain/patient-alert/patient-alert.repository';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreatePatientAlertDto, PatientAlertDto} from '../dtos';

@Injectable()
export class CreatePatientAlertService implements ApplicationService<CreatePatientAlertDto, PatientAlertDto> {
    constructor(
        private readonly patientAlertRepository: PatientAlertRepository,
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreatePatientAlertDto>): Promise<PatientAlertDto> {
        const patient = await this.patientRepository.findById(payload.patientId, actor.clinicId);

        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        const alert = PatientAlert.create({
            clinicId: actor.clinicId,
            patientId: payload.patientId,
            createdByMemberId: actor.clinicMemberId,
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
