import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {FormTemplate, inferSpecialtyGroup} from '../../../domain/form-template/entities';
import {FormTemplateRepository} from '../../../domain/form-template/form-template.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateFormTemplateDto, FormTemplateDto} from '../dtos';

@Injectable()
export class CreateFormTemplateService implements ApplicationService<CreateFormTemplateDto, FormTemplateDto> {
    constructor(private readonly formTemplateRepository: FormTemplateRepository) {}

    async execute({actor, payload}: Command<CreateFormTemplateDto>): Promise<FormTemplateDto> {
        const existing = await this.formTemplateRepository.findByCode(payload.code);
        if (existing) {
            throw new PreconditionException(`A template with code "${payload.code}" already exists.`);
        }

        // Public templates: system-wide, no clinic ownership.
        // Private templates: scoped to the actor's current clinic + member.
        const template = FormTemplate.create({
            code: payload.code,
            name: payload.name,
            description: payload.description ?? null,
            specialtyLabel: payload.specialty,
            specialtyGroup: inferSpecialtyGroup(payload.specialty),
            isPublic: payload.isPublic,
            clinicId: payload.isPublic ? null : actor.clinicId,
            createdByMemberId: payload.isPublic ? null : actor.clinicMemberId,
        });

        await this.formTemplateRepository.save(template);

        return new FormTemplateDto(template);
    }
}
