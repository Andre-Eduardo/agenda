import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ProductCategoryRepository} from '../../../domain/product-category/product-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetProductCategoryDto, ProductCategoryDto} from '../dtos';

@Injectable()
export class GetProductCategoryService implements ApplicationService<GetProductCategoryDto, ProductCategoryDto> {
    constructor(private readonly productTypeRepository: ProductCategoryRepository) {}

    async execute({payload}: Command<GetProductCategoryDto>): Promise<ProductCategoryDto> {
        const productCategory = await this.productTypeRepository.findById(payload.id);

        if (productCategory === null) {
            throw new ResourceNotFoundException('Product category not found', payload.id.toString());
        }

        return new ProductCategoryDto(productCategory);
    }
}
