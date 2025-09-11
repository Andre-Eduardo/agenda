import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {Product} from '../../../domain/product/entities';
import {DuplicateCodeException} from '../../../domain/product/product.exceptions';
import {ProductRepository} from '../../../domain/product/product.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateProductDto, ProductDto} from '../dtos';

@Injectable()
export class CreateProductService implements ApplicationService<CreateProductDto, ProductDto> {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateProductDto>): Promise<ProductDto> {
        const product = Product.create(payload);

        try {
            await this.productRepository.save(product);
        } catch (e) {
            if (e instanceof DuplicateCodeException) {
                throw new PreconditionException('Cannot create a product with a code already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, product);

        return new ProductDto(product);
    }
}
