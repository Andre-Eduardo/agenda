import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {ClinicalDocumentTemplateDto, UpsertTemplateDto} from '@application/clinical-document/dtos';
import {ClinicId} from '@domain/clinic/entities';
import {ClinicalDocumentTemplateRepository} from '@domain/clinical-document/clinical-document-template.repository';
import {ClinicalDocumentTemplate, ClinicalDocumentType} from '@domain/clinical-document/entities';

type UpsertTemplateInput = UpsertTemplateDto & {clinicId: ClinicId; type: ClinicalDocumentType};

@Injectable()
export class UpsertTemplateService implements ApplicationService<UpsertTemplateInput, ClinicalDocumentTemplateDto> {
    constructor(private readonly clinicalDocumentTemplateRepository: ClinicalDocumentTemplateRepository) {}

    async execute({actor, payload}: Command<UpsertTemplateInput>): Promise<ClinicalDocumentTemplateDto> {
        assertEntityBelongsToClinic(payload.clinicId, actor.clinicId);

        let template = await this.clinicalDocumentTemplateRepository.findByClinicAndType(
            payload.clinicId,
            payload.type
        );

        if (template) {
            template.change({name: payload.name, layoutJson: payload.layoutJson});
        } else {
            template = ClinicalDocumentTemplate.create({
                clinicId: payload.clinicId,
                type: payload.type,
                isDefault: false,
                name: payload.name,
                layoutJson: payload.layoutJson,
            });
        }

        await this.clinicalDocumentTemplateRepository.save(template);

        return new ClinicalDocumentTemplateDto(template);
    }
}
