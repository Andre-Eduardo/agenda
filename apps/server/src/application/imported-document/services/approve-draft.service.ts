import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DraftEvolutionRepository} from '../../../domain/draft-evolution/draft-evolution.repository';
import {EventDispatcher} from '../../../domain/event';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {Record, RecordSource} from '../../../domain/record/entities';
import {ImportStatus} from '../../../domain/record/entities/imported-document.entity';
import {ImportedDocumentRepository} from '../../../domain/record/imported-document.repository';
import {RecordRepository} from '../../../domain/record/record.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DraftEvolutionDto, GetDraftDto} from '../dtos';

@Injectable()
export class ApproveDraftService implements ApplicationService<GetDraftDto, DraftEvolutionDto> {
    constructor(
        private readonly importedDocumentRepository: ImportedDocumentRepository,
        private readonly draftEvolutionRepository: DraftEvolutionRepository,
        private readonly recordRepository: RecordRepository,
        private readonly professionalRepository: ProfessionalRepository,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute({actor, payload}: Command<GetDraftDto>): Promise<DraftEvolutionDto> {
        const document = await this.importedDocumentRepository.findById(payload.id);
        if (document === null) {
            throw new ResourceNotFoundException('ImportedDocument not found.', payload.id.toString());
        }

        const draft = await this.draftEvolutionRepository.findByImportedDocumentId(payload.id);
        if (draft === null) {
            throw new ResourceNotFoundException('Draft not found for this document.', payload.id.toString());
        }

        const professional = await this.professionalRepository.findByClinicMemberId(actor.clinicMemberId);
        if (professional === null) {
            throw new PreconditionException('DRAFT_APPROVAL_REQUIRES_PROFESSIONAL');
        }

        const record = Record.create({
            clinicId: actor.clinicId,
            patientId: draft.patientId,
            createdByMemberId: actor.clinicMemberId,
            responsibleProfessionalId: professional.id,
            templateType: draft.templateType,
            title: draft.title,
            attendanceType: draft.attendanceType,
            clinicalStatus: draft.clinicalStatus,
            conductTags: draft.conductTags,
            subjective: draft.subjective,
            objective: draft.objective,
            assessment: draft.assessment,
            plan: draft.plan,
            freeNotes: draft.freeNotes,
            eventDate: draft.eventDate,
            source: RecordSource.IMPORT,
            importedDocumentId: draft.importedDocumentId,
            wasHumanEdited: draft.wasHumanEdited,
            files: [],
        });

        draft.approve(actor.clinicMemberId, record.id);
        document.updateStatus(ImportStatus.APPROVED);

        await this.recordRepository.save(record);
        await this.draftEvolutionRepository.save(draft);
        await this.importedDocumentRepository.save(document);

        this.eventDispatcher.dispatch(actor, record);
        this.eventDispatcher.dispatch(actor, draft);

        return new DraftEvolutionDto(draft);
    }
}
