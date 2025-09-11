import {Injectable} from '@nestjs/common';
import {ProductCategoryRepository} from '../../../domain/product-category/product-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListProductCategoryDto, ProductCategoryDto} from '../dtos';

@Injectable()
export class ListProductCategoryService
    implements ApplicationService<ListProductCategoryDto, PaginatedDto<ProductCategoryDto>>
{
    constructor(private readonly productCategoryRepository: ProductCategoryRepository) {}

    async execute({payload}: Command<ListProductCategoryDto>): Promise<PaginatedDto<ProductCategoryDto>> {
        const result = await this.productCategoryRepository.search(
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
            data: result.data.map((productCategory) => new ProductCategoryDto(productCategory)),
        };
    }
}
