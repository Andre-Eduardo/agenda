import {Injectable} from '@nestjs/common';
import {ServiceCategoryRepository} from '../../../domain/service-category/service-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListServiceCategoryDto, ServiceCategoryDto} from '../dtos';

@Injectable()
export class ListServiceCategoryService
    implements ApplicationService<ListServiceCategoryDto, PaginatedDto<ServiceCategoryDto>>
{
    constructor(private readonly serviceCategoryRepository: ServiceCategoryRepository) {}

    async execute({payload}: Command<ListServiceCategoryDto>): Promise<PaginatedDto<ServiceCategoryDto>> {
        const result = await this.serviceCategoryRepository.search(
            payload.companyId,
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
            data: result.data.map((serviceCategory) => new ServiceCategoryDto(serviceCategory)),
        };
    }
}
