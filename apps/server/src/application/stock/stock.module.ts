import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {StockController} from './controllers';
import {CreateMainStockListener} from './listeners/create-main-stock.listener';
import {
    CreateStockService,
    DeleteStockService,
    GetStockService,
    ListStockService,
    UpdateStockService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [StockController],
    providers: [
        CreateStockService,
        ListStockService,
        GetStockService,
        UpdateStockService,
        DeleteStockService,
        CreateMainStockListener,
    ],
})
export class StockModule {}
