import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {FinancialReportController} from './controllers/financial-report.controller';
import {FinancialReportService} from './financial-report.service';

@Module({
    imports: [InfrastructureModule],
    controllers: [FinancialReportController],
    providers: [FinancialReportService],
})
export class FinancialReportModule {}
