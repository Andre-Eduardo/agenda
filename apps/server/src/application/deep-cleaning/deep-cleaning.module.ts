import {Module} from '@nestjs/common';
import {DomainModule} from '../../domain/domain.module';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {DeepCleaningController} from './controllers';
import {
    StartDeepCleaningService,
    FinishDeepCleaningService,
    GetDeepCleaningByRoomService,
    GetDeepCleaningService,
    ListDeepCleaningService,
} from './services';

@Module({
    imports: [DomainModule, InfrastructureModule],
    controllers: [DeepCleaningController],
    providers: [
        StartDeepCleaningService,
        ListDeepCleaningService,
        GetDeepCleaningService,
        GetDeepCleaningByRoomService,
        FinishDeepCleaningService,
    ],
})
export class DeepCleaningModule {}
