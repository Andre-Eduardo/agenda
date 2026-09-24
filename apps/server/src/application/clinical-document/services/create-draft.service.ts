import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ClinicalDocumentDto, CreateDraftDto} from '@application/clinical-document/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicalDocumentRepository} from '@domain/clinical-document/clinical-document.repository';
import {ClinicalDocument} from '@domain/clinical-document/entities';
import {EventDispatcher} from '@domain/event';
import {PatientRepository} from '@domain/patient/patient.repository';
import {ProfessionalRepository} from '@domain/professional/professional.repository';
import {RecordId} from '@domain/record/entities';
import {RecordRepository} from '@domain/record/record.repository';

@Injectable()
export class CreateDraftService implements ApplicationService<CreateDraftDto, ClinicalDocumentDto> {
    constructor(
        private readonly clinicalDocumentRepository: ClinicalDocumentRepository,
        private readonly patientRepository: PatientRepository,
        private readonly professionalRepository: ProfessionalRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly recordRepository: RecordRepository,
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateDraftDto>): Promise<ClinicalDocumentDto> {
        const patient = await this.patientRepository.findById(payload.patientId);

        if (patient === null) throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'write');

        const professional = await this.professionalRepository.findById(payload.responsibleProfessionalId);

        if (professional === null)
            throw new ResourceNotFoundException(
                'Professional not found.',
                payload.responsibleProfessionalId.toString()
            );
        const member = await this.clinicMemberRepository.findById(professional.clinicMemberId);

        if (member === null || !member.isActive)
            throw new ResourceNotFoundException('Clinic member not found.', professional.clinicMemberId.toString());
        assertEntityBelongsToClinic(member.clinicId, actor.clinicId);

        if (payload.appointmentId) {
            const appointment = await this.appointmentRepository.findById(payload.appointmentId);

            if (appointment === null)
                throw new ResourceNotFoundException('Appointment not found.', payload.appointmentId.toString());
            assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);

            if (!appointment.patientId.equals(payload.patientId))
                throw new ResourceNotFoundException(
                    'Appointment does not belong to patient.',
                    payload.appointmentId.toString()
                );
        }

        if (payload.recordId) {
            const record = await this.recordRepository.findById(RecordId.from(payload.recordId));

            if (record === null) throw new ResourceNotFoundException('Record not found.', payload.recordId);
            assertEntityBelongsToClinic(record.clinicId, actor.clinicId);

            if (!record.patientId.equals(payload.patientId))
                throw new ResourceNotFoundException('Record does not belong to patient.', payload.recordId);
        }

        const {__type: _type, ...contentJson} = payload.contentJson;

        const document = ClinicalDocument.create({
            clinicId: actor.clinicId,
            patientId: payload.patientId,
            createdByMemberId: actor.clinicMemberId,
            responsibleProfessionalId: payload.responsibleProfessionalId,
            type: payload.type,
            contentJson,
            appointmentId: payload.appointmentId ?? null,
            recordId: payload.recordId ?? null,
        });

        await this.clinicalDocumentRepository.save(document);

        this.eventDispatcher.dispatch(actor, document);

        return new ClinicalDocumentDto(document);
    }
}
