import {Module} from '@nestjs/common';
import {AppointmentController} from '@application/appointment/controllers/appointment.controller';
import {
    CallAppointmentService,
    CancelAppointmentService,
    CheckinAppointmentService,
    CreateAppointmentService,
    DeleteAppointmentService,
    GetAppointmentService,
    SearchAppointmentsService,
    UpdateAppointmentService,
} from '@application/appointment/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [AppointmentController],
    providers: [
        CallAppointmentService,
        CancelAppointmentService,
        CheckinAppointmentService,
        CreateAppointmentService,
        GetAppointmentService,
        SearchAppointmentsService,
        UpdateAppointmentService,
        DeleteAppointmentService,
    ],
})
export class AppointmentModule {}
