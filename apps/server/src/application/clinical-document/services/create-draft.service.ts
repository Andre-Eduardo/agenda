import {Injectable} from '@nestjs/common';
import {EventDispatcher} from '../../../domain/event';
import {ClinicalDocument} from '../../../domain/clinical-document/entities';
import {ClinicalDocumentRepository} from '../../../domain/clinical-document/clinical-document.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ClinicalDocumentDto, CreateDraftDto} from '../dtos';

@Injectable()
export class CreateDraftService implements ApplicationService<CreateDraftDto, ClinicalDocumentDto> {
    constructor(
        private readonly clinicalDocumentRepository: ClinicalDocumentRepository,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute({actor, payload}: Command<CreateDraftDto>): Promise<ClinicalDocumentDto> {
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
