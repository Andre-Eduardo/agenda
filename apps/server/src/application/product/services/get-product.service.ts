import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ProductRepository} from '../../../domain/product/product.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetProductDto, ProductDto} from '../dtos';

@Injectable()
export class GetProductService implements ApplicationService<GetProductDto, ProductDto> {
    constructor(private readonly productRepository: ProductRepository) {}

    async execute({payload}: Command<GetProductDto>): Promise<ProductDto> {
        const product = await this.productRepository.findById(payload.id);

        if (!product) {
            throw new ResourceNotFoundException('Product not found', payload.id.toString());
        }

        return new ProductDto(product);
    }
}
