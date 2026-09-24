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
import {ClinicPatientAccessModule} from '@application/clinic-patient-access/clinic-patient-access.module';
import {ProfessionalAgendaAccessModule} from '@application/professional-agenda-access/professional-agenda-access.module';
import {Authorizer, createAuthorizer} from '@domain/auth/authorizer';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {UserRepository} from '@domain/user/user.repository';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, ProfessionalAgendaAccessModule, ClinicPatientAccessModule],
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
        {provide: Authorizer, useFactory: createAuthorizer, inject: [UserRepository, ClinicMemberRepository]},
    ],
})
export class AppointmentModule {}
