import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicalDocumentDto} from '@application/clinical-document/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicalDocumentRepository} from '@domain/clinical-document/clinical-document.repository';
import {ClinicalDocumentId} from '@domain/clinical-document/entities';
import {EventDispatcher} from '@domain/event';

type CancelDocumentDto = {documentId: ClinicalDocumentId};

@Injectable()
export class CancelDocumentService implements ApplicationService<CancelDocumentDto, ClinicalDocumentDto> {
    constructor(
        private readonly clinicalDocumentRepository: ClinicalDocumentRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CancelDocumentDto>): Promise<ClinicalDocumentDto> {
        const document = await this.clinicalDocumentRepository.findById(payload.documentId);

        if (!document || document.clinicId.toString() !== actor.clinicId.toString()) {
            throw new ResourceNotFoundException('Clinical document not found.', payload.documentId.toString());
        }

        document.cancel();

        await this.clinicalDocumentRepository.save(document);

        this.eventDispatcher.dispatch(actor, document);

        return new ClinicalDocumentDto(document);
    }
}
