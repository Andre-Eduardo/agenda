import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {CreateRecordDto, RecordDto} from '@application/record/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {EventDispatcher} from '@domain/event';
import {PatientRepository} from '@domain/patient/patient.repository';
import {ProfessionalRepository} from '@domain/professional/professional.repository';
import {File, FileId, Record, ImportedDocumentId, RecordSource} from '@domain/record/entities';
import {ImportedDocumentRepository} from '@domain/record/imported-document.repository';
import {RecordRepository} from '@domain/record/record.repository';

@Injectable()
export class CreateRecordService implements ApplicationService<CreateRecordDto, RecordDto> {
    constructor(
        private readonly recordRepository: RecordRepository,
        private readonly patientRepository: PatientRepository,
        private readonly professionalRepository: ProfessionalRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly importedDocumentRepository: ImportedDocumentRepository,
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateRecordDto>): Promise<RecordDto> {
        const patient = await this.patientRepository.findById(payload.patientId);

        if (patient === null) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'write');

        const professional = await this.professionalRepository.findById(payload.responsibleProfessionalId);

        if (professional === null) {
            throw new ResourceNotFoundException(
                'Professional not found.',
                payload.responsibleProfessionalId.toString()
            );
        }

        const member = await this.clinicMemberRepository.findById(professional.clinicMemberId);

        if (member === null || !member.isActive) {
            throw new ResourceNotFoundException('Clinic member not found.', professional.clinicMemberId.toString());
        }

        assertEntityBelongsToClinic(member.clinicId, actor.clinicId);

        if (payload.appointmentId) {
            const appointment = await this.appointmentRepository.findById(payload.appointmentId);

            if (appointment === null)
                throw new ResourceNotFoundException('Appointment not found.', payload.appointmentId.toString());
            assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);

            if (!appointment.patientId.equals(payload.patientId)) {
                throw new ResourceNotFoundException(
                    'Appointment does not belong to patient.',
                    payload.appointmentId.toString()
                );
            }
        }

        if (payload.importedDocumentId) {
            const importedDocument = await this.importedDocumentRepository.findById(
                ImportedDocumentId.from(payload.importedDocumentId)
            );

            if (importedDocument === null)
                throw new ResourceNotFoundException('Imported document not found.', payload.importedDocumentId);
            assertEntityBelongsToClinic(importedDocument.clinicId, actor.clinicId);

            if (!importedDocument.patientId.equals(payload.patientId)) {
                throw new ResourceNotFoundException(
                    'Imported document does not belong to patient.',
                    payload.importedDocumentId
                );
            }
        }

        const now = new Date();

        const record = Record.create({
            clinicId: actor.clinicId,
            createdByMemberId: actor.clinicMemberId,
            responsibleProfessionalId: payload.responsibleProfessionalId,
            patientId: payload.patientId,
            description: payload.description ?? null,
            templateType: payload.templateType ?? null,
            title: payload.title ?? null,
            attendanceType: payload.attendanceType ?? null,
            clinicalStatus: payload.clinicalStatus ?? null,
            conductTags: payload.conductTags ?? [],
            subjective: payload.subjective ?? null,
            objective: payload.objective ?? null,
            assessment: payload.assessment ?? null,
            plan: payload.plan ?? null,
            freeNotes: payload.freeNotes ?? null,
            eventDate: payload.eventDate ?? null,
            appointmentId: payload.appointmentId ?? null,
            source: payload.source ?? RecordSource.MANUAL,
            importedDocumentId: payload.importedDocumentId ? ImportedDocumentId.from(payload.importedDocumentId) : null,
            wasHumanEdited: payload.wasHumanEdited ?? false,
            isLocked: false,
            files: [],
        });

        if (payload.files && payload.files.length > 0) {
            const files = payload.files.map(
                (f) =>
                    new File({
                        id: FileId.generate(),
                        clinicId: actor.clinicId,
                        createdByMemberId: actor.clinicMemberId,
                        recordId: record.id,
                        patientId: null,
                        fileName: f.fileName,
                        url: f.url,
                        description: f.description,
                        createdAt: now,
                        updatedAt: now,
                        deletedAt: null,
                    })
            );

            record.files = files;
        }

        await this.recordRepository.save(record);

        this.eventDispatcher.dispatch(actor, record);

        return new RecordDto(record);
    }
}
