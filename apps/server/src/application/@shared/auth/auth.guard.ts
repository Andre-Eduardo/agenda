import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {Request} from 'express';
import {AccessDeniedException, AccessDeniedReason, UnauthenticatedException} from '../../../domain/@shared/exceptions';
import {Permission} from '../../../domain/auth';
import {Authorizer} from '../../../domain/auth/authorizer';
import {CompanyId} from '../../../domain/company/entities';
import {Token, TokenProvider, TokenScope} from '../../../domain/user/token';
import {AUTHORIZE_KEY} from './authorize.decorator';
import {BYPASS_COMPANY} from './bypass-company.decorator';
import {IS_PUBLIC_KEY} from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly authCookie: string,
        private readonly companyCookie: string,
        private readonly tokenProvider: TokenProvider,
        private readonly authorizer: Authorizer,
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.getTokenFromRequest(request);

        if (token === null) {
            throw new UnauthenticatedException('Token not found or malformed.');
        }

        if (!token.scope.includes(TokenScope.AUTH)) {
            throw new UnauthenticatedException('Token does not have the required scope.');
        }

        if (!(await this.tokenProvider.validate(token))) {
            throw new UnauthenticatedException('Invalid token.');
        }

        const company = this.getCompanyFromRequest(request);
        const shouldBypassCompany = this.reflector.getAllAndOverride<boolean>(BYPASS_COMPANY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!shouldBypassCompany && (company === null || !token.companies.some((id) => id.equals(company)))) {
            throw new AccessDeniedException(
                'Token does not have access to the requested company.',
                AccessDeniedReason.NOT_ALLOWED
            );
        }

        request.actor = {
            ...request.actor,
            userId: token.userId,
        };

        const permissions = this.reflector.get<Permission[] | undefined>(AUTHORIZE_KEY, context.getHandler());

        if (permissions === undefined) {
            return true;
        }

        for (const permission of permissions) {
            if (await this.authorizer.validate(company, token.userId, permission)) {
                return true;
            }
        }

        throw new AccessDeniedException(
            `The user "${token.userId}" does not have the required permissions: [${permissions.join(', ')}]`,
            AccessDeniedReason.INSUFFICIENT_PERMISSIONS
        );
    }

    private getTokenFromRequest(request: Request): Token | null {
        const signedCookies = request.signedCookies as Record<string, string> | undefined;
        const cookie = signedCookies?.[this.authCookie];

        if (!cookie) {
            return null;
        }

        try {
            return this.tokenProvider.parse(cookie);
        } catch {
            return null;
        }
    }

    private getCompanyFromRequest(request: Request): CompanyId | null {
        const signedCookies = request.signedCookies as Record<string, string> | undefined;
        const cookie = signedCookies?.[this.companyCookie];

        if (!cookie) {
            return null;
        }

        return CompanyId.from(cookie);
    }
}
