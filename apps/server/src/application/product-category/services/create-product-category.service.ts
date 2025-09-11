import {Injectable} from '@nestjs/common';
import {DuplicateNameException, PreconditionException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ProductCategory} from '../../../domain/product-category/entities';
import {ProductCategoryRepository} from '../../../domain/product-category/product-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateProductCategoryDto, ProductCategoryDto} from '../dtos';

@Injectable()
export class CreateProductCategoryService implements ApplicationService<CreateProductCategoryDto, ProductCategoryDto> {
    constructor(
        private readonly productCategoryRepository: ProductCategoryRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateProductCategoryDto>): Promise<ProductCategoryDto> {
        const productCategory = ProductCategory.create(payload);

        try {
            await this.productCategoryRepository.save(productCategory);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot create a product category with a name already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, productCategory);

        return new ProductCategoryDto(productCategory);
    }
}
