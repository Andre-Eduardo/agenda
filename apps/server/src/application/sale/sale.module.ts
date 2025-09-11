import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {DirectSaleController} from './controllers';
import {
    CreateDirectSaleService,
    GetDirectSaleService,
    ListDirectSaleService,
    UpdateDirectSaleService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [DirectSaleController],
    providers: [CreateDirectSaleService, ListDirectSaleService, GetDirectSaleService, UpdateDirectSaleService],
})
export class SaleModule {}
