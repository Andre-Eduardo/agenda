import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {AppointmentController} from './controllers/appointment.controller';
import {
    CallAppointmentService,
    CancelAppointmentService,
    CheckinAppointmentService,
    CreateAppointmentService,
    DeleteAppointmentService,
    GetAppointmentService,
    SearchAppointmentsService,
    UpdateAppointmentService,
} from './services';

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
