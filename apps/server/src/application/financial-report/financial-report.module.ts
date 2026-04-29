import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { FinancialReportController } from "@application/financial-report/controllers/financial-report.controller";
import { FinancialReportService } from "@application/financial-report/financial-report.service";

@Module({
  imports: [InfrastructureModule],
  controllers: [FinancialReportController],
  providers: [FinancialReportService],
})
export class FinancialReportModule {}
