import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
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
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CancelDocumentDto>): Promise<ClinicalDocumentDto> {
        const document = await this.clinicalDocumentRepository.findById(payload.documentId);

        if (!document) {
            throw new ResourceNotFoundException('Clinical document not found.', payload.documentId.toString());
        }

        assertEntityBelongsToClinic(document.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, document.patientId, 'write');

        document.cancel();

        await this.clinicalDocumentRepository.save(document);

        this.eventDispatcher.dispatch(actor, document);

        return new ClinicalDocumentDto(document);
    }
}
