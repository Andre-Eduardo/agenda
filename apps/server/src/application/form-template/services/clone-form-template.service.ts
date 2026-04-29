import { Injectable } from "@nestjs/common";
import { PreconditionException, ResourceNotFoundException } from "@domain/@shared/exceptions";
import { FormTemplate, FormTemplateId } from "@domain/form-template/entities";
import { FormTemplateRepository } from "@domain/form-template/form-template.repository";
import { FormTemplateVersionRepository } from "@domain/form-template-version/form-template-version.repository";
import { FormTemplateVersion, FormStatus } from "@domain/form-template-version/entities";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { FormTemplateDto } from "@application/form-template/dtos";

export type CloneFormTemplateDto = {
  templateId: FormTemplateId;
  code: string;
  name?: string;
};

@Injectable()
export class CloneFormTemplateService implements ApplicationService<
  CloneFormTemplateDto,
  FormTemplateDto
> {
  constructor(
    private readonly formTemplateRepository: FormTemplateRepository,
    private readonly formTemplateVersionRepository: FormTemplateVersionRepository,
  ) {}

  async execute({ actor, payload }: Command<CloneFormTemplateDto>): Promise<FormTemplateDto> {
    const source = await this.formTemplateRepository.findById(payload.templateId);

    if (!source) {
      throw new ResourceNotFoundException("Source form template not found.", "FormTemplate");
    }

    // Owners can clone any template they own; everyone can clone public ones.
    const sourceBelongsToActorClinic =
      source.clinicId !== null && source.clinicId.equals(actor.clinicId);

    if (!source.isPublic && !sourceBelongsToActorClinic) {
      throw new PreconditionException(
        "Only public templates or templates from your clinic can be cloned.",
      );
    }

    const existingCode = await this.formTemplateRepository.findByCode(payload.code);

    if (existingCode) {
      throw new PreconditionException(`A template with code "${payload.code}" already exists.`);
    }

    // Cloned templates are always private to the actor's clinic.
    const cloned = FormTemplate.create({
      code: payload.code,
      name: payload.name ?? `${source.name} (cópia)`,
      description: source.description,
      specialtyGroup: source.specialtyGroup,
      specialtyLabel: source.specialtyLabel,
      isPublic: false,
      clinicId: actor.clinicId,
      createdByMemberId: actor.clinicMemberId,
    });

    await this.formTemplateRepository.save(cloned);

    // Clone the latest published version if it exists
    const sourceVersion = await this.formTemplateVersionRepository.findLatestPublished(source.id);

    if (sourceVersion) {
      const clonedVersion = FormTemplateVersion.create({
        templateId: cloned.id,
        versionNumber: 1,
        status: FormStatus.DRAFT,
        definitionJson: sourceVersion.definitionJson,
        schemaJson: sourceVersion.schemaJson,
      });

      await this.formTemplateVersionRepository.save(clonedVersion);
    }

    return new FormTemplateDto(cloned);
  }
}
