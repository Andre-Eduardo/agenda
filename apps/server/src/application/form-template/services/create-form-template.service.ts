import {Injectable} from '@nestjs/common';
import {FormTemplate} from '../../../domain/form-template/entities';
import {FormTemplateRepository} from '../../../domain/form-template/form-template.repository';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateFormTemplateDto, FormTemplateDto} from '../dtos';

@Injectable()
export class CreateFormTemplateService implements ApplicationService<CreateFormTemplateDto, FormTemplateDto> {
    constructor(private readonly formTemplateRepository: FormTemplateRepository) {}

    async execute({payload}: Command<CreateFormTemplateDto>): Promise<FormTemplateDto> {
        const existing = await this.formTemplateRepository.findByCode(payload.code);
        if (existing) {
            throw new PreconditionException(`A template with code "${payload.code}" already exists.`);
        }

        const template = FormTemplate.create({
            code: payload.code,
            name: payload.name,
            description: payload.description ?? null,
            specialty: payload.specialty,
            isPublic: payload.isPublic,
            professionalId: payload.professionalId ?? null,
        });

        await this.formTemplateRepository.save(template);

        return new FormTemplateDto(template);
    }
}
