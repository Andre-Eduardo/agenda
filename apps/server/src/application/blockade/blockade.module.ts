import {Module} from '@nestjs/common';
import {DomainModule} from '../../domain/domain.module';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {BlockadeController} from './controllers';
import {
    FinishBlockadeService,
    GetBlockadeByRoomService,
    GetBlockadeService,
    ListBlockadeService,
    StartBlockadeService,
    UpdateBlockadeService,
} from './services';

@Module({
    imports: [DomainModule, InfrastructureModule],
    controllers: [BlockadeController],
    providers: [
        StartBlockadeService,
        UpdateBlockadeService,
        FinishBlockadeService,
        GetBlockadeService,
        GetBlockadeByRoomService,
        ListBlockadeService,
    ],
})
export class BlockadeModule {}
