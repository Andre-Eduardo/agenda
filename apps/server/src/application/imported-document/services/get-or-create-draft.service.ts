import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DraftEvolution, DraftEvolutionStatus} from '../../../domain/draft-evolution/entities/draft-evolution.entity';
import {DraftEvolutionRepository} from '../../../domain/draft-evolution/draft-evolution.repository';
import {ImportedDocumentId} from '../../../domain/record/entities/imported-document.entity';
import {ImportedDocumentRepository} from '../../../domain/record/imported-document.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DraftEvolutionDto, GetDraftDto} from '../dtos';

@Injectable()
export class GetOrCreateDraftService implements ApplicationService<GetDraftDto, DraftEvolutionDto> {
    constructor(
        private readonly importedDocumentRepository: ImportedDocumentRepository,
        private readonly draftEvolutionRepository: DraftEvolutionRepository,
    ) {}

    async execute({actor, payload}: Command<GetDraftDto>): Promise<DraftEvolutionDto> {
        const document = await this.importedDocumentRepository.findById(payload.id);

        if (document === null) {
            throw new ResourceNotFoundException('ImportedDocument not found.', payload.id.toString());
        }

        const existing = await this.draftEvolutionRepository.findByImportedDocumentId(payload.id);

        if (existing !== null) {
            return new DraftEvolutionDto(existing);
        }

        const draft = DraftEvolution.create({
            clinicId: actor.clinicId,
            patientId: document.patientId,
            createdByMemberId: actor.clinicMemberId,
            importedDocumentId: ImportedDocumentId.from(payload.id.toString()),
            conductTags: [],
            reviewRequired: document.reviewRequired,
            overallConfidence: document.aiConfidence ?? null,
            status: DraftEvolutionStatus.DRAFT,
            wasHumanEdited: false,
        });

        await this.draftEvolutionRepository.save(draft);

        return new DraftEvolutionDto(draft);
    }
}
