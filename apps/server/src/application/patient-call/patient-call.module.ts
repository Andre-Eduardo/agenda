import {Module} from '@nestjs/common';
import {AttendanceModule} from '@application/attendance/attendance.module';
import {ClinicPatientAccessModule} from '@application/clinic-patient-access/clinic-patient-access.module';
import {PatientCallController} from '@application/patient-call/controllers';
import {PatientCallPanelService, PatientCallQueueService} from '@application/patient-call/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, AttendanceModule, ClinicPatientAccessModule],
    controllers: [PatientCallController],
    providers: [PatientCallPanelService, PatientCallQueueService],
})
export class PatientCallModule {}
