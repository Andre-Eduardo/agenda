import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ServiceCategoryController} from './controllers/service-category.controller';
import {
    CreateServiceCategoryService,
    DeleteServiceCategoryService,
    GetServiceCategoryService,
    ListServiceCategoryService,
    UpdateServiceCategoryService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ServiceCategoryController],
    providers: [
        CreateServiceCategoryService,
        ListServiceCategoryService,
        GetServiceCategoryService,
        UpdateServiceCategoryService,
        DeleteServiceCategoryService,
    ],
})
export class ServiceCategoryModule {}
