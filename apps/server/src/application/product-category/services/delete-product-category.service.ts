import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ProductCategoryRepository} from '../../../domain/product-category/product-category.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteProductCategoryDto} from '../dtos';

@Injectable()
export class DeleteProductCategoryService implements ApplicationService<DeleteProductCategoryDto> {
    constructor(
        private readonly productCategoryRepository: ProductCategoryRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteProductCategoryDto>): Promise<void> {
        const productCategory = await this.productCategoryRepository.findById(payload.id);

        if (productCategory === null) {
            throw new ResourceNotFoundException('Product category not found', payload.id.toString());
        }

        productCategory.delete();

        await this.productCategoryRepository.delete(payload.id);
        this.eventDispatcher.dispatch(actor, productCategory);
    }
}
