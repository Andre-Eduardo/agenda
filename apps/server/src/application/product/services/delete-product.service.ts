import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ProductRepository} from '../../../domain/product/product.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteProductDto} from '../dtos';

@Injectable()
export class DeleteProductService implements ApplicationService<DeleteProductDto> {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteProductDto>): Promise<void> {
        const product = await this.productRepository.findById(payload.id);

        if (!product) {
            throw new ResourceNotFoundException('Product not found', payload.id.toString());
        }

        product.delete();

        await this.productRepository.delete(payload.id);

        this.eventDispatcher.dispatch(actor, product);
    }
}
