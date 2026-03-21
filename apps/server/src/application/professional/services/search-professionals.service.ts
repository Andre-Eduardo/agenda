import {Injectable} from '@nestjs/common';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {PaginatedDto} from '../../@shared/dto';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ProfessionalDto, SearchProfessionalsDto} from '../dtos';

@Injectable()
export class SearchProfessionalsService implements ApplicationService<SearchProfessionalsDto, PaginatedDto<ProfessionalDto>> {
    constructor(private readonly professionalRepository: ProfessionalRepository) {}

    async execute({payload}: Command<SearchProfessionalsDto>): Promise<PaginatedDto<ProfessionalDto>> {
        const {term, sort, ...rest} = payload;

        const result = await this.professionalRepository.search(
            {
                ...rest,
                sort: sort ? (Object.entries(sort) as [keyof typeof sort, 'asc' | 'desc'][]).map(([key, direction]) => ({key, direction})) : undefined,
            },
            {term: term ?? undefined}
        );

        return {
            data: result.data.map((professional) => new ProfessionalDto(professional)),
            totalCount: result.totalCount,
        };
    }
}
