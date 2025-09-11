import {Injectable} from '@nestjs/common';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ProductCategoryRepository} from '../../../domain/product-category/product-category.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {ProductCategoryDto, UpdateProductCategoryDto} from '../dtos';

@Injectable()
export class UpdateProductCategoryService implements ApplicationService<UpdateProductCategoryDto, ProductCategoryDto> {
    constructor(
        private readonly productCategoryRepository: ProductCategoryRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateProductCategoryDto>): Promise<ProductCategoryDto> {
        const productCategory = await this.productCategoryRepository.findById(payload.id);

        if (productCategory === null) {
            throw new ResourceNotFoundException('Product category not found', payload.id.toString());
        }

        productCategory.change(payload);

        try {
            await this.productCategoryRepository.save(productCategory);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot update a product category with a name already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, productCategory);

        return new ProductCategoryDto(productCategory);
    }
}
