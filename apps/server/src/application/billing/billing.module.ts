import {Module} from '@nestjs/common';
import {BillingReportController} from '@application/billing/billing-report.controller';
import {BillingReportService} from '@application/billing/billing-report.service';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [BillingReportController],
    providers: [BillingReportService],
    exports: [BillingReportService],
})
export class BillingModule {}
