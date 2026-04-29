import { MiddlewareConsumer, Module, NestModule, Provider } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector } from "@nestjs/core";
import { GlobalAuthorizer, MultiAuthorizer } from "@domain/auth/authorizer";
import { TokenProvider } from "@domain/user/token";
import { UserRepository } from "@domain/user/user.repository";
import { EnvConfigService } from "@infrastructure/config";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { AuthGuard } from "@application/@shared/auth";
import { RequestContextMiddleware } from "@application/@shared/auth/context";
import {
  ApiExceptionFilter,
  HttpExceptionFilter,
  ZodExceptionFilter,
} from "@application/@shared/exception/filter";
import {
  ExceptionLoggerInterceptor,
  RequestLoggerMiddleware,
} from "@application/@shared/logger/handlers";
import { ZodValidationPipe } from "@application/@shared/validation";
import { AppointmentModule } from "@application/appointment/appointment.module";
import { AppointmentReminderModule } from "@application/appointment-reminder/appointment-reminder.module";
import { AuthModule } from "@application/auth/auth.module";
import { ClinicReminderConfigModule } from "@application/clinic-reminder-config/clinic-reminder-config.module";
import { ClinicModule } from "@application/clinic/clinic.module";
import { ClinicMemberModule } from "@application/clinic-member/clinic-member.module";
import { ClinicPatientAccessModule } from "@application/clinic-patient-access/clinic-patient-access.module";
import { DocumentPermissionModule } from "@application/document-permission/document-permission.module";
import { ClinicalProfileModule } from "@application/clinical-profile/clinical-profile.module";
import { EventModule } from "@application/event/event.module";
import { PatientAlertModule } from "@application/patient-alert/patient-alert.module";
import { PatientModule } from "@application/patient/patient.module";
import { FormTemplateModule } from "@application/form-template/form-template.module";
import { PatientFormModule } from "@application/patient-form/patient-form.module";
import { ProfessionalModule } from "@application/professional/professional.module";
import { RecordModule } from "@application/record/record.module";
import { UploadModule } from "@application/upload/upload.module";
import { UserModule } from "@application/user/user.module";
import { ClinicalChatModule } from "@application/clinical-chat/clinical-chat.module";
import { KnowledgeBaseModule } from "@application/knowledge-base/knowledge-base.module";
import { AgentModule } from "@application/agent/agent.module";
import { ImportedDocumentModule } from "@application/imported-document/imported-document.module";
import { ClinicalDocumentModule } from "@application/clinical-document/clinical-document.module";
import { SubscriptionModule } from "@application/subscription/subscription.module";
import { BillingModule } from "@application/billing/billing.module";
import { PaymentModule } from "@application/payment/payment.module";
import { AppointmentPaymentModule } from "@application/appointment-payment/appointment-payment.module";
import { FinancialReportModule } from "@application/financial-report/financial-report.module";
import { WorkingHoursModule } from "@application/working-hours/working-hours.module";
import { MemberBlockModule } from "@application/member-block/member-block.module";

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
    useFactory: (
      configService: EnvConfigService,
      tokenProvider: TokenProvider,
      userRepository: UserRepository,
    ) =>
      new AuthGuard(
        configService.auth.cookieName,
        configService.clinicMember.cookieName,
        tokenProvider,
        new MultiAuthorizer(new GlobalAuthorizer(userRepository)),
        new Reflector(),
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
    WorkingHoursModule,
    MemberBlockModule,
  ],
  providers: [...exceptionFilters, ...pipes, ...interceptors, ...guards],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware, RequestContextMiddleware).forRoutes("*");
  }
}
