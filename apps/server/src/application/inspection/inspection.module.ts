import {Module} from '@nestjs/common';
import {DomainModule} from '../../domain/domain.module';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {InspectionController} from './controllers';
import {
    ApproveInspectionService,
    GetInspectionByRoomService,
    GetInspectionService,
    ListInspectionService,
    RejectInspectionService,
} from './services';

@Module({
    imports: [DomainModule, InfrastructureModule],
    controllers: [InspectionController],
    providers: [
        GetInspectionService,
        GetInspectionByRoomService,
        ListInspectionService,
        ApproveInspectionService,
        RejectInspectionService,
    ],
})
export class InspectionModule {}
