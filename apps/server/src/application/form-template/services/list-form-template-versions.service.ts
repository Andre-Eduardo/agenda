import {Injectable} from '@nestjs/common';
import {FormTemplateId} from '../../../domain/form-template/entities';
import {FormTemplateRepository} from '../../../domain/form-template/form-template.repository';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ApplicationService, Command} from '../../@shared/application.service';
import {FormTemplateVersionDto} from '../dtos';

export type ListVersionsDto = {templateId: FormTemplateId};

@Injectable()
export class ListFormTemplateVersionsService
    implements ApplicationService<ListVersionsDto, FormTemplateVersionDto[]>
{
    constructor(
        private readonly formTemplateRepository: FormTemplateRepository,
        private readonly formTemplateVersionRepository: FormTemplateVersionRepository
    ) {}

    async execute({payload}: Command<ListVersionsDto>): Promise<FormTemplateVersionDto[]> {
        const template = await this.formTemplateRepository.findById(payload.templateId);
        if (!template) {
            throw new ResourceNotFoundException('Form template not found.', 'FormTemplate');
        }

        const versions = await this.formTemplateVersionRepository.listByTemplate(template.id);
        return versions.map((v) => new FormTemplateVersionDto(v));
    }
}
