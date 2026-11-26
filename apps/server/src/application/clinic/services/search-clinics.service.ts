import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PaginatedDto} from '@application/@shared/dto';
import {ClinicDto, SearchClinicsDto} from '@application/clinic/dtos';
import type {MaybeAuthenticatedActor} from '@domain/@shared/actor';
import {ClinicRepository} from '@domain/clinic/clinic.repository';

@Injectable()
export class SearchClinicsService implements ApplicationService<
    SearchClinicsDto,
    PaginatedDto<ClinicDto>,
    MaybeAuthenticatedActor
> {
    constructor(private readonly clinicRepository: ClinicRepository) {}

    async execute({payload}: Command<SearchClinicsDto, MaybeAuthenticatedActor>): Promise<PaginatedDto<ClinicDto>> {
        const {term, sort, ...rest} = payload;

        const result = await this.clinicRepository.search(
            {...rest, sort: sort ?? undefined},
            {term: term ?? undefined}
        );

        return {
            data: result.data.map((clinic) => new ClinicDto(clinic)),
            totalCount: result.totalCount,
        };
    }
}
