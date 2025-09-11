import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {CashierController} from './controllers';
import {CloseCashierService, GetCashierService, ListCashierService, OpenCashierService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [CashierController],
    providers: [OpenCashierService, CloseCashierService, GetCashierService, ListCashierService],
})
export class CashierModule {}
