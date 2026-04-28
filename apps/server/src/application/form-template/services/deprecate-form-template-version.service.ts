import {Injectable} from '@nestjs/common';
import {FormTemplateVersionId} from '../../../domain/form-template-version/entities';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ApplicationService, Command} from '../../@shared/application.service';
import {FormTemplateVersionDto} from '../dtos';

export type DeprecateVersionDto = {versionId: FormTemplateVersionId};

@Injectable()
export class DeprecateFormTemplateVersionService
    implements ApplicationService<DeprecateVersionDto, FormTemplateVersionDto>
{
    constructor(private readonly formTemplateVersionRepository: FormTemplateVersionRepository) {}

    async execute({payload}: Command<DeprecateVersionDto>): Promise<FormTemplateVersionDto> {
        const version = await this.formTemplateVersionRepository.findById(payload.versionId);

        if (!version) {
            throw new ResourceNotFoundException('Form template version not found.', 'FormTemplateVersion');
        }

        version.deprecate();
        await this.formTemplateVersionRepository.save(version);

        return new FormTemplateVersionDto(version);
    }
}
