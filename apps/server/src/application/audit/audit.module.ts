import {Module} from '@nestjs/common';
import {AuditLogController} from '@application/audit/controllers/audit-log.controller';
import {SearchAuditLogsService} from '@application/audit/services/search-audit-logs.service';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [AuditLogController],
    providers: [SearchAuditLogsService],
})
export class AuditModule {}
