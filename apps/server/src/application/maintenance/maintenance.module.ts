import {Module} from '@nestjs/common';
import {DomainModule} from '../../domain/domain.module';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {MaintenanceController} from './controllers';
import {
    FinishMaintenanceService,
    GetMaintenanceService,
    ListMaintenanceService,
    StartMaintenanceService,
    UpdateMaintenanceService,
} from './services';
import {GetMaintenanceByRoomService} from './services/get-maintenance-by-room.service';

@Module({
    imports: [DomainModule, InfrastructureModule],
    controllers: [MaintenanceController],
    providers: [
        StartMaintenanceService,
        UpdateMaintenanceService,
        FinishMaintenanceService,
        GetMaintenanceService,
        GetMaintenanceByRoomService,
        ListMaintenanceService,
    ],
})
export class MaintenanceModule {}
