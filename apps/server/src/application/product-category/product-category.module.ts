import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ProductCategoryController} from './controllers';
import {
    CreateProductCategoryService,
    DeleteProductCategoryService,
    GetProductCategoryService,
    ListProductCategoryService,
    UpdateProductCategoryService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ProductCategoryController],
    providers: [
        CreateProductCategoryService,
        ListProductCategoryService,
        GetProductCategoryService,
        UpdateProductCategoryService,
        DeleteProductCategoryService,
    ],
})
export class ProductCategoryModule {}
