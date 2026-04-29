import { Injectable } from "@nestjs/common";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicalDocumentTemplate, ClinicalDocumentType } from "@domain/clinical-document/entities";
import { ClinicalDocumentTemplateRepository } from "@domain/clinical-document/clinical-document-template.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import {
  ClinicalDocumentTemplateDto,
  UpsertTemplateDto,
} from "@application/clinical-document/dtos";

type UpsertTemplateInput = UpsertTemplateDto & { clinicId: ClinicId; type: ClinicalDocumentType };

@Injectable()
export class UpsertTemplateService implements ApplicationService<
  UpsertTemplateInput,
  ClinicalDocumentTemplateDto
> {
  constructor(
    private readonly clinicalDocumentTemplateRepository: ClinicalDocumentTemplateRepository,
  ) {}

  async execute({ payload }: Command<UpsertTemplateInput>): Promise<ClinicalDocumentTemplateDto> {
    let template = await this.clinicalDocumentTemplateRepository.findByClinicAndType(
      payload.clinicId,
      payload.type,
    );

    if (template) {
      template.change({ name: payload.name, layoutJson: payload.layoutJson });
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
