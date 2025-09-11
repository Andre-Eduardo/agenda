import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {DuplicateCodeException} from '../../../domain/product/product.exceptions';
import {ProductRepository} from '../../../domain/product/product.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ProductDto, UpdateProductDto} from '../dtos';

@Injectable()
export class UpdateProductService implements ApplicationService<UpdateProductDto, ProductDto> {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateProductDto>): Promise<ProductDto> {
        const product = await this.productRepository.findById(payload.id);

        if (!product) {
            throw new ResourceNotFoundException('Product not found', payload.id.toString());
        }

        product.change(payload);

        try {
            await this.productRepository.save(product);
        } catch (e) {
            if (e instanceof DuplicateCodeException) {
                throw new PreconditionException('Cannot update a product with a code already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, product);

        return new ProductDto(product);
    }
}
