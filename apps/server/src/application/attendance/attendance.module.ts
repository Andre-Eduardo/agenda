import {Module} from '@nestjs/common';
import {AttendanceController} from '@application/attendance/controllers';
import {AttendanceScope, AttendanceService} from '@application/attendance/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [AttendanceController],
    providers: [AttendanceService, AttendanceScope],
    exports: [AttendanceScope],
})
export class AttendanceModule {}
