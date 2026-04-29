import { Injectable } from "@nestjs/common";
import { FormTemplateId } from "@domain/form-template/entities";
import { FormTemplateRepository } from "@domain/form-template/form-template.repository";
import { FormTemplateVersion, FormStatus } from "@domain/form-template-version/entities";
import { FormTemplateVersionRepository } from "@domain/form-template-version/form-template-version.repository";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ApplicationService, Command } from "@application/@shared/application.service";
import {
  CreateFormTemplateVersionDto,
  FormTemplateVersionDto,
} from "@application/form-template/dtos";

export type CreateVersionPayload = CreateFormTemplateVersionDto & { templateId: FormTemplateId };

@Injectable()
export class CreateFormTemplateVersionService implements ApplicationService<
  CreateVersionPayload,
  FormTemplateVersionDto
> {
  constructor(
    private readonly formTemplateRepository: FormTemplateRepository,
    private readonly formTemplateVersionRepository: FormTemplateVersionRepository,
  ) {}

  async execute({ payload }: Command<CreateVersionPayload>): Promise<FormTemplateVersionDto> {
    const template = await this.formTemplateRepository.findById(payload.templateId);

    if (!template) {
      throw new ResourceNotFoundException("Form template not found.", "FormTemplate");
    }

    const nextVersionNumber = await this.formTemplateVersionRepository.findNextVersionNumber(
      template.id,
    );

    const version = FormTemplateVersion.create({
      templateId: template.id,
      versionNumber: nextVersionNumber,
      status: FormStatus.DRAFT,
      definitionJson: payload.definitionJson,
      schemaJson: payload.schemaJson ?? null,
    });

    await this.formTemplateVersionRepository.save(version);

    return new FormTemplateVersionDto(version);
  }
}
