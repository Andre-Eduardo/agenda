import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {FormTemplateRepository} from '../../../domain/form-template/form-template.repository';
import {PaginatedList} from '../../../domain/@shared/repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {searchFormTemplatesSchema, FormTemplateDto} from '../dtos';
import type {FormTemplate} from '../../../domain/form-template/entities';

export type SearchFormTemplatesPayload = z.infer<typeof searchFormTemplatesSchema>;

@Injectable()
export class SearchFormTemplatesService
    implements ApplicationService<SearchFormTemplatesPayload, PaginatedDto<FormTemplateDto>>
{
    constructor(private readonly formTemplateRepository: FormTemplateRepository) {}

    async execute({payload}: Command<SearchFormTemplatesPayload>): Promise<PaginatedDto<FormTemplateDto>> {
        const filter = this.buildFilter(payload);
        const result: PaginatedList<FormTemplate> = await this.formTemplateRepository.search(
            {limit: payload.limit, sort: payload.sort},
            filter
        );

        return {
            data: result.data.map((t) => new FormTemplateDto(t)),
            totalCount: result.totalCount,
        };
    }

    private buildFilter(payload: SearchFormTemplatesPayload): Parameters<FormTemplateRepository['search']>[1] {
        const filter: Parameters<FormTemplateRepository['search']>[1] = {
            specialty: payload.specialty,
        };

        if (payload.scope === 'public') {
            filter.isPublic = true;
            filter.professionalId = null;
        } else if (payload.scope === 'mine' && payload.professionalId) {
            filter.professionalId = payload.professionalId;
        }

        return filter;
    }
}
