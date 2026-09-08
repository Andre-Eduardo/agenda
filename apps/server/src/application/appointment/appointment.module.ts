import {Module} from '@nestjs/common';
import {AppointmentController} from '@application/appointment/controllers/appointment.controller';
import {
    CallAppointmentService,
    CancelAppointmentService,
    CheckinAppointmentService,
    CompleteAppointmentService,
    ConfirmAppointmentService,
    CreateAppointmentService,
    DeleteAppointmentService,
    GetAppointmentService,
    MarkNoShowAppointmentService,
    SearchAppointmentsService,
    UpdateAppointmentService,
} from '@application/appointment/services';
import {ProfessionalAgendaAccessModule} from '@application/professional-agenda-access/professional-agenda-access.module';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, ProfessionalAgendaAccessModule],
    controllers: [AppointmentController],
    providers: [
        CallAppointmentService,
        CancelAppointmentService,
        CheckinAppointmentService,
        CompleteAppointmentService,
        ConfirmAppointmentService,
        CreateAppointmentService,
        GetAppointmentService,
        MarkNoShowAppointmentService,
        SearchAppointmentsService,
        UpdateAppointmentService,
        DeleteAppointmentService,
    ],
})
export class AppointmentModule {}
