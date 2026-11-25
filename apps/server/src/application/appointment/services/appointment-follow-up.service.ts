import {Injectable} from '@nestjs/common';
import {AppointmentFollowUpDto, CreateAppointmentDto} from '@application/appointment/dtos';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {GetRecordService} from '@application/record/services';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason, InvalidInputException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {RecordPermission} from '@domain/auth';
import {Authorizer} from '@domain/auth/authorizer';
import {PatientId} from '@domain/patient/entities';
import {ProfessionalId} from '@domain/professional/entities';
import {ProfessionalRepository} from '@domain/professional/professional.repository';
import type {RecordId} from '@domain/record/entities';

@Injectable()
export class AppointmentFollowUpService {
    constructor(
        private readonly authorizer: Authorizer,
        private readonly getRecord: GetRecordService,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly professionalRepository: ProfessionalRepository
    ) {}

    async assertSourceMatches(actor: Actor, recordId: RecordId, payload: CreateAppointmentDto): Promise<void> {
        const record = await this.readSource(actor, recordId);

        if (record.patientId !== payload.patientId.toString()) {
            throw new InvalidInputException('appointment.follow_up_patient_mismatch');
        }

        const professional = await this.professionalRepository.findById(
            ProfessionalId.from(record.responsibleProfessionalId)
        );

        if (!professional?.clinicMemberId.equals(payload.attendedByMemberId)) {
            throw new InvalidInputException('appointment.follow_up_professional_mismatch');
        }
    }

    async list(actor: Actor, recordId: RecordId): Promise<AppointmentFollowUpDto[]> {
        const record = await this.readSource(actor, recordId);
        const patientId = PatientId.from(record.patientId);

        await this.patientAccessChecker.assertCanAccess(actor, patientId, 'appointment');

        const appointments = await this.appointmentRepository.findFollowUps(actor.clinicId, patientId, recordId);

        return appointments.map((appointment) => new AppointmentFollowUpDto(appointment));
    }

    private async readSource(actor: Actor, recordId: RecordId) {
        if (!(await this.authorizer.validate(actor.clinicMemberId, actor.userId, RecordPermission.VIEW))) {
            throw new AccessDeniedException('Record access denied.', AccessDeniedReason.NOT_ALLOWED);
        }

        return this.getRecord.execute({actor, payload: {id: recordId}});
    }
}
