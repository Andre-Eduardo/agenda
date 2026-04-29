import { Injectable } from "@nestjs/common";
import { FormTemplateId } from "@domain/form-template/entities";
import { FormTemplateRepository } from "@domain/form-template/form-template.repository";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ApplicationService, Command } from "@application/@shared/application.service";

export type DeleteFormTemplateDto = { templateId: FormTemplateId };

@Injectable()
export class DeleteFormTemplateService implements ApplicationService<DeleteFormTemplateDto> {
  constructor(private readonly formTemplateRepository: FormTemplateRepository) {}

  async execute({ payload }: Command<DeleteFormTemplateDto>): Promise<void> {
    const template = await this.formTemplateRepository.findById(payload.templateId);

    if (!template) {
      throw new ResourceNotFoundException("Form template not found.", "FormTemplate");
    }

    template.softDelete();
    await this.formTemplateRepository.save(template);
  }
}
