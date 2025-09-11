import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {CustomerController} from './controllers';
import {
    CreateCustomerService,
    DeleteCustomerService,
    GetCustomerService,
    ListCustomerService,
    UpdateCustomerService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [CustomerController],
    providers: [
        CreateCustomerService,
        ListCustomerService,
        GetCustomerService,
        UpdateCustomerService,
        DeleteCustomerService,
    ],
})
export class CustomerModule {}
