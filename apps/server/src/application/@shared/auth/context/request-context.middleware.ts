import {Inject, Injectable, NestMiddleware} from '@nestjs/common';
import {CookieOptions, NextFunction, Request, Response} from 'express';
import {unknownActor} from '../../../../domain/@shared/actor';
import {ExpressContextActions} from '../../../../infrastructure/auth';
import {AUTH_COOKIE, COMPANY_COOKIE, COOKIE_OPTIONS} from '../../../../infrastructure/auth/auth.module';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    constructor(
        @Inject(AUTH_COOKIE)
        private readonly authCookie: string,
        @Inject(COMPANY_COOKIE)
        private readonly companyCookie: string,
        @Inject(COOKIE_OPTIONS)
        private readonly cookieOptions: CookieOptions
    ) {}

    use(request: Request, response: Response, next: NextFunction): void {
        // This is the default value for an unauthenticated user, it should be overwritten
        // by the auth guard if the user is authenticated.
        request.actor = {
            ...unknownActor,
            ip: request.ip ?? unknownActor.ip,
        };

        if (request.method === 'GET') {
            request.query.professionalId ??= this.getProfessionalFromRequest(request);
        } else if (request.body && typeof request.body === 'object') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- This is a safe access
            request.body.professionalId ??= this.getProfessionalFromRequest(request);
        }

        response.actions = new ExpressContextActions(response, this.authCookie, this.companyCookie, {
            ...this.cookieOptions,
            domain: request.hostname,
        });

        next();
    }

    private getProfessionalFromRequest(request: Request): string | undefined {
        const signedCookies = request.signedCookies as Record<string, string> | undefined;

        return signedCookies?.[this.companyCookie];
    }
}
