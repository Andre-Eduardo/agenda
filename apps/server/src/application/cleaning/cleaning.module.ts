import {Module} from '@nestjs/common';
import {DomainModule} from '../../domain/domain.module';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {CleaningController} from './controllers';
import {
    StartCleaningService,
    FinishCleaningService,
    GetCleaningByRoomService,
    GetCleaningService,
    ListCleaningService,
} from './services';

@Module({
    imports: [DomainModule, InfrastructureModule],
    controllers: [CleaningController],
    providers: [
        StartCleaningService,
        ListCleaningService,
        GetCleaningService,
        GetCleaningByRoomService,
        FinishCleaningService,
    ],
})
export class CleaningModule {}
