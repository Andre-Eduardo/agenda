import {MiddlewareConsumer, Module, NestModule, Provider} from '@nestjs/common';
import {APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector} from '@nestjs/core';
import {CompanyPositionAuthorizer, GlobalAuthorizer, MultiAuthorizer} from '../domain/auth/authorizer';
import {EmployeePositionRepository} from '../domain/employee-position/employee-position.repository';
import {TokenProvider} from '../domain/user/token';
import {UserRepository} from '../domain/user/user.repository';
import {EnvConfigService} from '../infrastructure/config';
import {InfrastructureModule} from '../infrastructure/infrastructure.module';
import {AuthGuard} from './@shared/auth';
import {RequestContextMiddleware} from './@shared/auth/context';
import {ApiExceptionFilter, HttpExceptionFilter, ZodExceptionFilter} from './@shared/exception/filter';
import {ExceptionLoggerInterceptor, RequestLoggerMiddleware} from './@shared/logger/handlers';
import {ZodValidationPipe} from './@shared/validation';
import {AccountModule} from './account/account.module';
import {AuditModule} from './audit/audit.module';
import {AuthModule} from './auth/auth.module';
import {BlockadeModule} from './blockade/blockade.module';
import {CashierModule} from './cashier/cashier.module';
import {CleaningModule} from './cleaning/cleaning.module';
import {CompanyModule} from './company/company.module';
import {CustomerModule} from './customer/customer.module';
import {DeepCleaningModule} from './deep-cleaning/deep-cleaning.module';
import {DefectModule} from './defect/defect.module';
import {DefectTypeModule} from './defect-type/defect-type.module';
import {EmployeeModule} from './employee/employee.module';
import {EmployeePositionModule} from './employee-position/employee-position.module';
import {EventModule} from './event/event.module';
import {InspectionModule} from './inspection/inspection.module';
import {MaintenanceModule} from './maintenance/maintenance.module';
import {PaymentMethodModule} from './payment-method/payment-method.module';
import {ProductModule} from './product/product.module';
import {ProductCategoryModule} from './product-category/product-category.module';
import {ReservationModule} from './reservation/reservation.module';
import {RoomModule} from './room/room.module';
import {RoomCategoryModule} from './room-category/room-category.module';
import {SaleModule} from './sale/sale.module';
import {ServiceModule} from './service/service.module';
import {ServiceCategoryModule} from './service-category/service-category.module';
import {StockModule} from './stock/stock.module';
import {SupplierModule} from './supplier/supplier.module';
import {TransactionModule} from './transaction/transaction.module';
import {UserModule} from './user/user.module';

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
            positionRepository: EmployeePositionRepository
        ) =>
            new AuthGuard(
                configService.auth.cookieName,
                configService.company.cookieName,
                tokenProvider,
                new MultiAuthorizer(
                    new CompanyPositionAuthorizer(positionRepository),
                    new GlobalAuthorizer(userRepository)
                ),
                new Reflector()
            ),
        inject: [EnvConfigService, TokenProvider, UserRepository, EmployeePositionRepository],
    },
];

@Module({
    imports: [
        InfrastructureModule,
        EventModule,
        AuthModule,
        UserModule,
        CompanyModule,
        RoomCategoryModule,
        RoomModule,
        ReservationModule,
        CashierModule,
        PaymentMethodModule,
        EmployeeModule,
        EmployeePositionModule,
        CustomerModule,
        TransactionModule,
        ProductModule,
        ProductCategoryModule,
        SaleModule,
        StockModule,
        SupplierModule,
        DefectTypeModule,
        DefectModule,
        ServiceCategoryModule,
        ServiceModule,
        CleaningModule,
        MaintenanceModule,
        InspectionModule,
        BlockadeModule,
        DeepCleaningModule,
        AccountModule,
        AuditModule,
    ],
    providers: [...exceptionFilters, ...pipes, ...interceptors, ...guards],
})
export class ApplicationModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(RequestLoggerMiddleware, RequestContextMiddleware).forRoutes('*');
    }
}
