import {Module} from '@nestjs/common';
import {ClinicReportController} from '@application/clinic-report/controllers';
import {GetAppointmentReportService} from '@application/clinic-report/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicReportController],
    providers: [GetAppointmentReportService],
})
export class ClinicReportModule {}
