import {MiddlewareConsumer, Module, NestModule, Provider} from '@nestjs/common';
import {APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector} from '@nestjs/core';
import { GlobalAuthorizer, MultiAuthorizer} from '../domain/auth/authorizer';
import {TokenProvider} from '../domain/user/token';
import {UserRepository} from '../domain/user/user.repository';
import {EnvConfigService} from '../infrastructure/config';
import {InfrastructureModule} from '../infrastructure/infrastructure.module';
import {AuthGuard} from './@shared/auth';
import {RequestContextMiddleware} from './@shared/auth/context';
import {ApiExceptionFilter, HttpExceptionFilter, ZodExceptionFilter} from './@shared/exception/filter';
import {ExceptionLoggerInterceptor, RequestLoggerMiddleware} from './@shared/logger/handlers';
import {ZodValidationPipe} from './@shared/validation';
import {AuthModule} from './auth/auth.module';
import {EventModule} from './event/event.module';


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
        ) =>
            new AuthGuard(
                configService.auth.cookieName,
                configService.company.cookieName,
                tokenProvider,
                new MultiAuthorizer(
                    new GlobalAuthorizer(userRepository)
                ),
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
        UserModule,
    ],
    providers: [...exceptionFilters, ...pipes, ...interceptors, ...guards],
})
export class ApplicationModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(RequestLoggerMiddleware, RequestContextMiddleware).forRoutes('*');
    }
}
