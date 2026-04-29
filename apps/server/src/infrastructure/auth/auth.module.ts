import { Module, Provider } from "@nestjs/common";
import { CookieOptions } from "express";
import { TokenProvider } from "@domain/user/token";
import { ConfigModule, EnvConfigService } from "@infrastructure/config";
import { JsonWebTokenProvider } from "@infrastructure/auth/jwt";

export const AUTH_COOKIE = "AUTH_COOKIE";
export const CLINIC_MEMBER_COOKIE = "CLINIC_MEMBER_COOKIE";
export const COOKIE_OPTIONS = "COOKIE_OPTIONS";

const providers: Provider[] = [
  {
    provide: AUTH_COOKIE,
    useFactory: (configService: EnvConfigService): string => configService.auth.cookieName,
    inject: [EnvConfigService],
  },
  {
    provide: CLINIC_MEMBER_COOKIE,
    useFactory: (configService: EnvConfigService): string => configService.clinicMember.cookieName,
    inject: [EnvConfigService],
  },
  {
    provide: COOKIE_OPTIONS,
    useFactory: (configService: EnvConfigService): CookieOptions => ({
      httpOnly: true,
      signed: true,
      secure: configService.isProd,
    }),
    inject: [EnvConfigService],
  },
  {
    provide: TokenProvider,
    useFactory: (configService: EnvConfigService) =>
      new JsonWebTokenProvider(
        configService.auth.token.expiration,
        configService.auth.token.secret,
      ),
    inject: [EnvConfigService],
  },
];

@Module({
  imports: [ConfigModule],
  providers,
  exports: providers,
})
export class AuthModule {}
