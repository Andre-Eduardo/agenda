import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import {
  AccessDeniedException,
  AccessDeniedReason,
  UnauthenticatedException,
} from "@domain/@shared/exceptions";
import { Permission } from "@domain/auth";
import { Authorizer } from "@domain/auth/authorizer";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { Token, TokenProvider, TokenScope } from "@domain/user/token";
import { AUTHORIZE_KEY } from "@application/@shared/auth/authorize.decorator";
import { BYPASS_CLINIC_MEMBER } from "@application/@shared/auth/bypass-clinic-member.decorator";
import { IS_PUBLIC_KEY } from "@application/@shared/auth/public.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authCookie: string,
    private readonly clinicMemberCookie: string,
    private readonly tokenProvider: TokenProvider,
    private readonly authorizer: Authorizer,
    private readonly reflector: Reflector,
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
      throw new UnauthenticatedException("Token not found or malformed.");
    }

    if (!token.scope.includes(TokenScope.AUTH)) {
      throw new UnauthenticatedException("Token does not have the required scope.");
    }

    if (!(await this.tokenProvider.validate(token))) {
      throw new UnauthenticatedException("Invalid token.");
    }

    const clinicMemberId = this.getClinicMemberFromRequest(request);
    const shouldBypassClinicMember = this.reflector.getAllAndOverride<boolean>(
      BYPASS_CLINIC_MEMBER,
      [context.getHandler(), context.getClass()],
    );

    const matchingMember =
      clinicMemberId === null
        ? null
        : (token.clinicMembers.find((m) => m.clinicMemberId.equals(clinicMemberId)) ?? null);

    if (!shouldBypassClinicMember && matchingMember === null) {
      throw new AccessDeniedException(
        "Token does not have access to the requested clinic member.",
        AccessDeniedReason.NOT_ALLOWED,
      );
    }

    request.actor = {
      ...request.actor,
      userId: token.userId,
      clinicId: matchingMember?.clinicId ?? null,
      clinicMemberId: matchingMember?.clinicMemberId ?? null,
    };

    const permissions = this.reflector.get<Permission[] | undefined>(
      AUTHORIZE_KEY,
      context.getHandler(),
    );

    if (permissions === undefined) {
      return true;
    }

    for (const permission of permissions) {
      if (await this.authorizer.validate(clinicMemberId, token.userId, permission)) {
        return true;
      }
    }

    throw new AccessDeniedException(
      `The user "${token.userId}" does not have the required permissions: [${permissions.join(", ")}]`,
      AccessDeniedReason.INSUFFICIENT_PERMISSIONS,
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

  private getClinicMemberFromRequest(request: Request): ClinicMemberId | null {
    const signedCookies = request.signedCookies as Record<string, string> | undefined;
    const cookie = signedCookies?.[this.clinicMemberCookie];

    if (!cookie) {
      return null;
    }

    return ClinicMemberId.from(cookie);
  }
}
