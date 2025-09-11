import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {PaymentMethodController} from './controllers';
import {
    CreatePaymentMethodService,
    DeletePaymentMethodService,
    GetPaymentMethodService,
    ListPaymentMethodService,
    UpdatePaymentMethodService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [PaymentMethodController],
    providers: [
        CreatePaymentMethodService,
        ListPaymentMethodService,
        GetPaymentMethodService,
        UpdatePaymentMethodService,
        DeletePaymentMethodService,
    ],
})
export class PaymentMethodModule {}
