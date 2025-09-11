import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ServiceController} from './controller';
import {
    CreateServiceService,
    DeleteServiceService,
    GetServiceService,
    ListServiceService,
    UpdateServiceService,
} from './service';

@Module({
    imports: [InfrastructureModule],
    controllers: [ServiceController],
    providers: [
        CreateServiceService,
        GetServiceService,
        UpdateServiceService,
        DeleteServiceService,
        ListServiceService,
    ],
})
export class ServiceModule {}
