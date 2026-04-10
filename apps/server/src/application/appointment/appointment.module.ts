import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {AppointmentController} from './controllers/appointment.controller';
import {
    CancelAppointmentService,
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
        CancelAppointmentService,
        CreateAppointmentService,
        GetAppointmentService,
        SearchAppointmentsService,
        UpdateAppointmentService,
        DeleteAppointmentService,
    ],
})
export class AppointmentModule {}
