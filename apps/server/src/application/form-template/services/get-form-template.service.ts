import { Injectable } from "@nestjs/common";
import { FormTemplateId } from "@domain/form-template/entities";
import { FormTemplateRepository } from "@domain/form-template/form-template.repository";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { FormTemplateDto } from "@application/form-template/dtos";

export type GetFormTemplateDto = { templateId: FormTemplateId };

@Injectable()
export class GetFormTemplateService implements ApplicationService<
  GetFormTemplateDto,
  FormTemplateDto
> {
  constructor(private readonly formTemplateRepository: FormTemplateRepository) {}

  async execute({ payload }: Command<GetFormTemplateDto>): Promise<FormTemplateDto> {
    const template = await this.formTemplateRepository.findById(payload.templateId);

    if (!template) {
      throw new ResourceNotFoundException("Form template not found.", "FormTemplate");
    }

    return new FormTemplateDto(template);
  }
}
