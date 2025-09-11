import {Module} from '@nestjs/common';
import {DomainModule} from '../../domain/domain.module';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {AuditController} from './controllers';
import {
    FinishAuditService,
    GetAuditByRoomService,
    GetAuditService,
    ListAuditService,
    StartAuditService,
} from './services';

@Module({
    imports: [DomainModule, InfrastructureModule],
    controllers: [AuditController],
    providers: [StartAuditService, FinishAuditService, GetAuditService, GetAuditByRoomService, ListAuditService],
})
export class AuditModule {}
