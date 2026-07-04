import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PaginatedDto} from '@application/@shared/dto';
import {ProfessionalDto, SearchProfessionalsDto} from '@application/professional/dtos';
import {ProfessionalRepository} from '@domain/professional/professional.repository';

@Injectable()
export class SearchProfessionalsService implements ApplicationService<
    SearchProfessionalsDto,
    PaginatedDto<ProfessionalDto>
> {
    constructor(private readonly professionalRepository: ProfessionalRepository) {}

    async execute({actor, payload}: Command<SearchProfessionalsDto>): Promise<PaginatedDto<ProfessionalDto>> {
        const {term, sort, ...rest} = payload;

        const result = await this.professionalRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
            },
            {
                term: term ?? undefined,
                clinicId: actor.clinicId ?? undefined,
            }
        );

        return {
            data: result.data.map((professional) => new ProfessionalDto(professional)),
            totalCount: result.totalCount,
        };
    }
}
