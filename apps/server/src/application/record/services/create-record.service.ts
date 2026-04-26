import {Injectable} from '@nestjs/common';
import {EventDispatcher} from '../../../domain/event';
import {File, FileId, Record, ImportedDocumentId, RecordSource} from '../../../domain/record/entities';
import {RecordRepository} from '../../../domain/record/record.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateRecordDto, RecordDto} from '../dtos';

@Injectable()
export class CreateRecordService implements ApplicationService<CreateRecordDto, RecordDto> {
    constructor(
        private readonly recordRepository: RecordRepository,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute({actor, payload}: Command<CreateRecordDto>): Promise<RecordDto> {
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
                    }),
            );

            record.files = files;
        }

        await this.recordRepository.save(record);

        this.eventDispatcher.dispatch(actor, record);

        return new RecordDto(record);
    }
}
