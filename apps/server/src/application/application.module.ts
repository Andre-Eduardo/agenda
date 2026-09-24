import {MiddlewareConsumer, Module, NestModule, Provider} from '@nestjs/common';
import {APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector} from '@nestjs/core';
import {AuthGuard} from '@application/@shared/auth';
import {RequestContextMiddleware} from '@application/@shared/auth/context';
import {ApiExceptionFilter, HttpExceptionFilter, ZodExceptionFilter} from '@application/@shared/exception/filter';
import {ExceptionLoggerInterceptor, RequestLoggerMiddleware} from '@application/@shared/logger/handlers';
import {ZodValidationPipe} from '@application/@shared/validation';
import {AgentModule} from '@application/agent/agent.module';
import {AppointmentPaymentModule} from '@application/appointment-payment/appointment-payment.module';
import {AppointmentReminderModule} from '@application/appointment-reminder/appointment-reminder.module';
import {AppointmentModule} from '@application/appointment/appointment.module';
import {AuditHttpInterceptor} from '@application/audit/audit-http.interceptor';
import {AuditModule} from '@application/audit/audit.module';
import {AuthModule} from '@application/auth/auth.module';
import {BillingModule} from '@application/billing/billing.module';
import {ClinicMemberModule} from '@application/clinic-member/clinic-member.module';
import {ClinicPatientAccessModule} from '@application/clinic-patient-access/clinic-patient-access.module';
import {ClinicReminderConfigModule} from '@application/clinic-reminder-config/clinic-reminder-config.module';
import {ClinicModule} from '@application/clinic/clinic.module';
import {ClinicalChatModule} from '@application/clinical-chat/clinical-chat.module';
import {ClinicalDocumentModule} from '@application/clinical-document/clinical-document.module';
import {ClinicalProfileModule} from '@application/clinical-profile/clinical-profile.module';
import {DocumentPermissionModule} from '@application/document-permission/document-permission.module';
import {EventModule} from '@application/event/event.module';
import {FinancialReportModule} from '@application/financial-report/financial-report.module';
import {FormTemplateModule} from '@application/form-template/form-template.module';
import {ImportedDocumentModule} from '@application/imported-document/imported-document.module';
import {InsuranceClaimModule} from '@application/insurance-claim/insurance-claim.module';
import {KnowledgeBaseModule} from '@application/knowledge-base/knowledge-base.module';
import {MemberBlockModule} from '@application/member-block/member-block.module';
import {PackagePlanModule} from '@application/package-plan/package-plan.module';
import {PatientAlertModule} from '@application/patient-alert/patient-alert.module';
import {PatientFormModule} from '@application/patient-form/patient-form.module';
import {PatientInsuranceEnrollmentModule} from '@application/patient-insurance-enrollment/patient-insurance-enrollment.module';
import {PatientPackageModule} from '@application/patient-package/patient-package.module';
import {PatientSubscriptionPlanModule} from '@application/patient-subscription-plan/patient-subscription-plan.module';
import {PatientSubscriptionModule} from '@application/patient-subscription/patient-subscription.module';
import {PatientModule} from '@application/patient/patient.module';
import {PaymentModule} from '@application/payment/payment.module';
import {ProfessionalAgendaAccessModule} from '@application/professional-agenda-access/professional-agenda-access.module';
import {ProfessionalModule} from '@application/professional/professional.module';
import {RecordModule} from '@application/record/record.module';
import {RoomModule} from '@application/room/room.module';
import {SubscriptionModule} from '@application/subscription/subscription.module';
import {UploadModule} from '@application/upload/upload.module';
import {UserModule} from '@application/user/user.module';
import {WorkingHoursModule} from '@application/working-hours/working-hours.module';
import {AuditLogRepository} from '@domain/audit/audit-log.repository';
import {createAuthorizer} from '@domain/auth/authorizer';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {TokenProvider} from '@domain/user/token';
import {UserRepository} from '@domain/user/user.repository';
import {EnvConfigService} from '@infrastructure/config';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

const exceptionFilters: Provider[] = [
    {
        provide: APP_FILTER,
        useClass: ApiExceptionFilter,
    },
    {
        provide: APP_FILTER,
        useClass: HttpExceptionFilter,
    },
    {
        provide: APP_FILTER,
        useClass: ZodExceptionFilter,
    },
];

const pipes: Provider[] = [
    {
        provide: APP_PIPE,
        useValue: new ZodValidationPipe(),
    },
];

const interceptors: Provider[] = [
    {
        provide: APP_INTERCEPTOR,
        useClass: AuditHttpInterceptor,
    },
    {
        provide: APP_INTERCEPTOR,
        useClass: ExceptionLoggerInterceptor,
    },
];

const guards: Provider[] = [
    {
        provide: APP_GUARD,
        useFactory: (
            configService: EnvConfigService,
            tokenProvider: TokenProvider,
            userRepository: UserRepository,
            clinicMemberRepository: ClinicMemberRepository,
            auditLogRepository: AuditLogRepository
        ) =>
            new AuthGuard(
                configService.auth.cookieName,
                configService.clinicMember.cookieName,
                tokenProvider,
                createAuthorizer(userRepository, clinicMemberRepository),
                new Reflector(),
                clinicMemberRepository,
                auditLogRepository
            ),
        inject: [EnvConfigService, TokenProvider, UserRepository, ClinicMemberRepository, AuditLogRepository],
    },
];

@Module({
    imports: [
        InfrastructureModule,
        AuditModule,
        EventModule,
        AuthModule,
        ClinicModule,
        ClinicMemberModule,
        ClinicPatientAccessModule,
        ProfessionalAgendaAccessModule,
        DocumentPermissionModule,
        UserModule,
        ProfessionalModule,
        PatientModule,
        AppointmentModule,
        AppointmentReminderModule,
        ClinicReminderConfigModule,
        RecordModule,
        ClinicalProfileModule,
        PatientAlertModule,
        UploadModule,
        FormTemplateModule,
        PatientFormModule,
        ClinicalChatModule,
        KnowledgeBaseModule,
        AgentModule,
        ImportedDocumentModule,
        ClinicalDocumentModule,
        SubscriptionModule,
        BillingModule,
        PaymentModule,
        AppointmentPaymentModule,
        PatientInsuranceEnrollmentModule,
        InsuranceClaimModule,
        PackagePlanModule,
        PatientPackageModule,
        PatientSubscriptionPlanModule,
        PatientSubscriptionModule,
        FinancialReportModule,
        WorkingHoursModule,
        MemberBlockModule,
        RoomModule,
    ],
    providers: [...exceptionFilters, ...pipes, ...interceptors, ...guards],
})
export class ApplicationModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(RequestLoggerMiddleware, RequestContextMiddleware).forRoutes('*');
    }
}
