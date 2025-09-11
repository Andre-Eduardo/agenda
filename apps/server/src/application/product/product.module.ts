import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ProductController} from './controllers';
import {
    CreateProductService,
    DeleteProductService,
    GetProductService,
    ListProductService,
    UpdateProductService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ProductController],
    providers: [
        CreateProductService,
        ListProductService,
        GetProductService,
        UpdateProductService,
        DeleteProductService,
    ],
})
export class ProductModule {}
