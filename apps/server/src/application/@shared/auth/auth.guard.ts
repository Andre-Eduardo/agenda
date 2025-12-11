import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {Request} from 'express';
import {AccessDeniedException, AccessDeniedReason, UnauthenticatedException} from '../../../domain/@shared/exceptions';
import {Permission} from '../../../domain/auth';
import {Authorizer} from '../../../domain/auth/authorizer';
import {ProfessionalId} from '../../../domain/professional/entities';
import {Token, TokenProvider, TokenScope} from '../../../domain/user/token';
import {AUTHORIZE_KEY} from './authorize.decorator';
import {BYPASS_PROFESSIONAL} from './bypass-professional.decorator';
import {IS_PUBLIC_KEY} from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly authCookie: string,
        private readonly professionalCookie: string,
        private readonly tokenProvider: TokenProvider,
        private readonly authorizer: Authorizer,
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
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

        const professionalId = this.getProfessionalFromRequest(request);
        const shouldBypassProfessional = this.reflector.getAllAndOverride<boolean>(BYPASS_PROFESSIONAL, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (
            !shouldBypassProfessional &&
            (professionalId === null || !token.professionals.some((id) => id.equals(professionalId)))
        ) {
            throw new AccessDeniedException(
                'Token does not have access to the requested professional.',
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
            if (await this.authorizer.validate(professionalId, token.userId, permission)) {
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

    private getProfessionalFromRequest(request: Request): ProfessionalId | null {
        // Keeping 'companyCookie' name for now if it's injected config key, but logic uses ProfessionalId
        const signedCookies = request.signedCookies as Record<string, string> | undefined;
        const cookie = signedCookies?.[this.professionalCookie];

        if (!cookie) {
            return null;
        }

        return ProfessionalId.from(cookie);
    }
}
