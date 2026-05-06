import {Module} from '@nestjs/common';
import {FinancialReportController} from '@application/financial-report/controllers/financial-report.controller';
import {FinancialReportService} from '@application/financial-report/financial-report.service';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [FinancialReportController],
    providers: [FinancialReportService],
})
export class FinancialReportModule {}
