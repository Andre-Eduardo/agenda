import {Injectable} from '@nestjs/common';
import {ProductRepository} from '../../../domain/product/product.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListProductDto, ProductDto} from '../dtos';

@Injectable()
export class ListProductService implements ApplicationService<ListProductDto, PaginatedDto<ProductDto>> {
    constructor(private readonly productRepository: ProductRepository) {}

    async execute({payload}: Command<ListProductDto>): Promise<PaginatedDto<ProductDto>> {
        const result = await this.productRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                code: payload.code,
                categoryId: payload.categoryId,
            }
        );

        return {
            ...result,
            data: result.data.map((product) => new ProductDto(product)),
        };
    }
}
