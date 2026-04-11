import {Injectable} from '@nestjs/common';
import {FormTemplateVersionId} from '../../../domain/form-template-version/entities';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {ResourceNotFoundException, PreconditionException} from '../../../domain/@shared/exceptions';
import {ApplicationService, Command} from '../../@shared/application.service';
import {FormTemplateVersionDto} from '../dtos';

export type PublishVersionDto = {versionId: FormTemplateVersionId};

@Injectable()
export class PublishFormTemplateVersionService
    implements ApplicationService<PublishVersionDto, FormTemplateVersionDto>
{
    constructor(private readonly formTemplateVersionRepository: FormTemplateVersionRepository) {}

    async execute({payload}: Command<PublishVersionDto>): Promise<FormTemplateVersionDto> {
        const version = await this.formTemplateVersionRepository.findById(payload.versionId);
        if (!version) {
            throw new ResourceNotFoundException('Form template version not found.', 'FormTemplateVersion');
        }
        if (version.isPublished()) {
            throw new PreconditionException('Version is already published.');
        }

        version.publish();
        await this.formTemplateVersionRepository.save(version);

        return new FormTemplateVersionDto(version);
    }
}
