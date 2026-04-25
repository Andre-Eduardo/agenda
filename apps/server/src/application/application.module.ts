import {MiddlewareConsumer, Module, NestModule, Provider} from '@nestjs/common';
import {APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector} from '@nestjs/core';
import {GlobalAuthorizer, MultiAuthorizer} from '../domain/auth/authorizer';
import {TokenProvider} from '../domain/user/token';
import {UserRepository} from '../domain/user/user.repository';
import {EnvConfigService} from '../infrastructure/config';
import {InfrastructureModule} from '../infrastructure/infrastructure.module';
import {AuthGuard} from './@shared/auth';
import {RequestContextMiddleware} from './@shared/auth/context';
import {ApiExceptionFilter, HttpExceptionFilter, ZodExceptionFilter} from './@shared/exception/filter';
import {ExceptionLoggerInterceptor, RequestLoggerMiddleware} from './@shared/logger/handlers';
import {ZodValidationPipe} from './@shared/validation';
import {AppointmentModule} from './appointment/appointment.module';
import {AppointmentReminderModule} from './appointment-reminder/appointment-reminder.module';
import {AuthModule} from './auth/auth.module';
import {ClinicReminderConfigModule} from './clinic-reminder-config/clinic-reminder-config.module';
import {ClinicModule} from './clinic/clinic.module';
import {ClinicMemberModule} from './clinic-member/clinic-member.module';
import {ClinicPatientAccessModule} from './clinic-patient-access/clinic-patient-access.module';
import {DocumentPermissionModule} from './document-permission/document-permission.module';
import {ClinicalProfileModule} from './clinical-profile/clinical-profile.module';
import {EventModule} from './event/event.module';
import {PatientAlertModule} from './patient-alert/patient-alert.module';
import {PatientModule} from './patient/patient.module';
import {FormTemplateModule} from './form-template/form-template.module';
import {PatientFormModule} from './patient-form/patient-form.module';
import {ProfessionalModule} from './professional/professional.module';
import {RecordModule} from './record/record.module';
import {UploadModule} from './upload/upload.module';
import {UserModule} from './user/user.module';
import {ClinicalChatModule} from './clinical-chat/clinical-chat.module';
import {KnowledgeBaseModule} from './knowledge-base/knowledge-base.module';
import {AgentModule} from './agent/agent.module';
import {ImportedDocumentModule} from './imported-document/imported-document.module';
import {ClinicalDocumentModule} from './clinical-document/clinical-document.module';
import {SubscriptionModule} from './subscription/subscription.module';
import {BillingModule} from './billing/billing.module';
import {PaymentModule} from './payment/payment.module';
import {AppointmentPaymentModule} from './appointment-payment/appointment-payment.module';
import {FinancialReportModule} from './financial-report/financial-report.module';

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
        useClass: ExceptionLoggerInterceptor,
    },
];

const guards: Provider[] = [
    {
        provide: APP_GUARD,
        useFactory: (configService: EnvConfigService, tokenProvider: TokenProvider, userRepository: UserRepository) =>
            new AuthGuard(
                configService.auth.cookieName,
                configService.clinicMember.cookieName,
                tokenProvider,
                new MultiAuthorizer(new GlobalAuthorizer(userRepository)),
                new Reflector()
            ),
        inject: [EnvConfigService, TokenProvider, UserRepository],
    },
];

@Module({
    imports: [
        InfrastructureModule,
        EventModule,
        AuthModule,
        ClinicModule,
        ClinicMemberModule,
        ClinicPatientAccessModule,
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
        FinancialReportModule,
    ],
    providers: [...exceptionFilters, ...pipes, ...interceptors, ...guards],
})
export class ApplicationModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(RequestLoggerMiddleware, RequestContextMiddleware).forRoutes('*');
    }
}
