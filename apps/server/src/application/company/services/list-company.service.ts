import {Injectable} from '@nestjs/common';
import {CompanyRepository} from '../../../domain/company/company.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListCompanyDto, CompanyDto} from '../dtos';

@Injectable()
export class ListCompanyService implements ApplicationService<ListCompanyDto, PaginatedDto<CompanyDto>> {
    constructor(private readonly companyRepository: CompanyRepository) {}

    async execute({payload}: Command<ListCompanyDto>): Promise<PaginatedDto<CompanyDto>> {
        const result = await this.companyRepository.search(
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
            }
        );

        return {
            ...result,
            data: result.data.map((company) => new CompanyDto(company)),
        };
    }
}
