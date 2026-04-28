import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DraftEvolutionRepository} from '../../../domain/draft-evolution/draft-evolution.repository';
import {ImportedDocumentRepository} from '../../../domain/record/imported-document.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DraftEvolutionDto, GetDraftDto, UpdateDraftBodyDto} from '../dtos';

export type UpdateDraftInput = GetDraftDto & UpdateDraftBodyDto;

@Injectable()
export class UpdateDraftService implements ApplicationService<UpdateDraftInput, DraftEvolutionDto> {
    constructor(
        private readonly importedDocumentRepository: ImportedDocumentRepository,
        private readonly draftEvolutionRepository: DraftEvolutionRepository,
    ) {}

    async execute({payload}: Command<UpdateDraftInput>): Promise<DraftEvolutionDto> {
        const document = await this.importedDocumentRepository.findById(payload.id);

        if (document === null) {
            throw new ResourceNotFoundException('ImportedDocument not found.', payload.id.toString());
        }

        const draft = await this.draftEvolutionRepository.findByImportedDocumentId(payload.id);

        if (draft === null) {
            throw new ResourceNotFoundException('Draft not found for this document.', payload.id.toString());
        }

        draft.updateFields({
            templateType: payload.templateType,
            title: payload.title ?? undefined,
            attendanceType: payload.attendanceType,
            clinicalStatus: payload.clinicalStatus ?? undefined,
            conductTags: payload.conductTags,
            subjective: payload.subjective ?? undefined,
            objective: payload.objective ?? undefined,
            assessment: payload.assessment ?? undefined,
            plan: payload.plan ?? undefined,
            freeNotes: payload.freeNotes ?? undefined,
            eventDate: payload.eventDate ?? undefined,
        });

        await this.draftEvolutionRepository.save(draft);

        return new DraftEvolutionDto(draft);
    }
}
