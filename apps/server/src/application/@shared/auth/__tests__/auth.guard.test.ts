import type { ExecutionContext } from "@nestjs/common";
import type { HttpArgumentsHost } from "@nestjs/common/interfaces";
import type { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { mock, mockDeep } from "jest-mock-extended";
import {
  AccessDeniedException,
  AccessDeniedReason,
  UnauthenticatedException,
} from "../../../../domain/@shared/exceptions";
import { RoomPermission } from "../../../../domain/auth";
import type { Authorizer } from "../../../../domain/auth/authorizer";
import { CompanyId } from "../../../../domain/company/entities";
import { UserId } from "../../../../domain/user/entities";
import { TokenScope } from "../../../../domain/user/token";
import { JsonWebToken, JsonWebTokenProvider } from "../../../../infrastructure/auth/jwt";
import { AuthGuard } from "../auth.guard";

describe("An auth guard", () => {
  const authCookie = "authCookie";
  const companyCookie = "companyCookie";
  const secret = "secret";
  const tokenProvider = new JsonWebTokenProvider(60, secret);
  const authorizer = mock<Authorizer>();
  const reflector = mock<Reflector>();
  const guard = new AuthGuard(authCookie, companyCookie, tokenProvider, authorizer, reflector);

  it("should allow access to public routes", async () => {
    const context = mock<ExecutionContext>();

    reflector.getAllAndOverride.mockReturnValueOnce(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("should allow access to valid tokens", async () => {
    const context = mock<ExecutionContext>();
    const companyId = CompanyId.generate();
    const token = tokenProvider.issue(UserId.generate(), {
      scope: [TokenScope.AUTH],
      companies: [companyId],
    });
    const request = mock<Request>({
      signedCookies: {
        [authCookie]: token.toString(),
        [companyCookie]: companyId.toString(),
      },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
    expect(tokenProvider.validate).toHaveBeenCalledWith(token);

    expect(request.actor).toMatchObject({ userId: token.userId });
  });

  it("should allow access to authorized routes", async () => {
    const context = mock<ExecutionContext>();
    const companyId = CompanyId.generate();
    const token = tokenProvider.issue(UserId.generate(), {
      scope: [TokenScope.AUTH],
      companies: [companyId],
    });
    const request = mock<Request>({
      signedCookies: {
        [authCookie]: token.toString(),
        [companyCookie]: companyId.toString(),
      },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    reflector.get.mockReturnValueOnce([RoomPermission.DELETE]);
    authorizer.validate.mockResolvedValueOnce(true);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
    expect(tokenProvider.validate).toHaveBeenCalledWith(token);

    expect(request.actor).toMatchObject({ userId: token.userId });

    expect(authorizer.validate).toHaveBeenCalledTimes(1);
    expect(authorizer.validate).toHaveBeenCalledWith(
      companyId,
      token.userId,
      RoomPermission.DELETE,
    );
  });

  it("should bypass the company validation", async () => {
    const context = mock<ExecutionContext>();
    const token = tokenProvider.issue(UserId.generate(), {
      scope: [TokenScope.AUTH],
      companies: [],
    });
    const request = mock<Request>({
      signedCookies: {
        [authCookie]: token.toString(),
        [companyCookie]: null,
      },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(true);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
    expect(tokenProvider.validate).toHaveBeenCalledWith(token);

    expect(request.actor).toMatchObject({ userId: token.userId });
  });

  it("should deny access when no token is present", async () => {
    const context = mock<ExecutionContext>();
    const request = mock<Request>({
      signedCookies: {
        [authCookie]: null,
      },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
      UnauthenticatedException,
      "Token not found or malformed.",
    );

    expect(tokenProvider.validate).not.toHaveBeenCalled();
  });

  it("should deny access to malformed tokens", async () => {
    const context = mock<ExecutionContext>();
    const request = mock<Request>({
      signedCookies: { [authCookie]: "invalid" },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
      UnauthenticatedException,
      "Token not found or malformed.",
    );

    expect(tokenProvider.validate).not.toHaveBeenCalled();
  });

  it("should deny access to expired tokens", async () => {
    const context = mock<ExecutionContext>();
    const token = JsonWebToken.signed(
      {
        userId: UserId.generate(),
        companies: [CompanyId.generate()],
        issueTime: new Date(2000),
        expirationTime: new Date(1000),
        scope: [TokenScope.AUTH],
      },
      secret,
    );
    const request = mock<Request>({
      signedCookies: { [authCookie]: token.toString() },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
      UnauthenticatedException,
      "Invalid token.",
    );

    expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
    expect(tokenProvider.validate).toHaveBeenCalledWith(token);
  });

  it("should deny access to tokens with invalid signatures", async () => {
    const context = mock<ExecutionContext>();
    const token = JsonWebToken.signed(
      {
        userId: UserId.generate(),
        companies: [CompanyId.generate()],
        issueTime: new Date(2000),
        expirationTime: new Date(Date.now() + 10_000),
        scope: [TokenScope.AUTH],
      },
      "invalid-secret",
    );
    const request = mock<Request>({
      signedCookies: { [authCookie]: token.toString() },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
      UnauthenticatedException,
      "Invalid token.",
    );

    expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
    expect(tokenProvider.validate).toHaveBeenCalledWith(token);
  });

  it("should deny access to tokens with invalid scopes", async () => {
    const context = mock<ExecutionContext>();
    const token = tokenProvider.issue(UserId.generate(), {
      scope: [TokenScope.EMAIL_VERIFICATION],
    });
    const request = mock<Request>({
      signedCookies: { [authCookie]: token.toString() },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
      UnauthenticatedException,
      "Token does not have the required scope.",
    );

    expect(tokenProvider.validate).not.toHaveBeenCalled();
  });

  it("should deny access when no company is present", async () => {
    const context = mock<ExecutionContext>();
    const companyId = CompanyId.generate();
    const token = tokenProvider.issue(UserId.generate(), {
      scope: [TokenScope.AUTH],
      companies: [companyId],
    });
    const request = mock<Request>({
      signedCookies: {
        [authCookie]: token.toString(),
        [companyCookie]: null,
      },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
    const expectation = expect(guard.canActivate(context));

    await expectation.rejects.toThrowWithMessage(
      AccessDeniedException,
      "Token does not have access to the requested company.",
    );
    await expectation.rejects.toContainEntry(["reason", AccessDeniedReason.NOT_ALLOWED]);

    expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
    expect(tokenProvider.validate).toHaveBeenCalledWith(token);
  });

  it("should deny access when the token does not have access to the requested company", async () => {
    const context = mock<ExecutionContext>();
    const companyId = CompanyId.generate();
    const token = tokenProvider.issue(UserId.generate(), {
      scope: [TokenScope.AUTH],
      companies: [companyId],
    });
    const request = mock<Request>({
      signedCookies: {
        [authCookie]: token.toString(),
        [companyCookie]: CompanyId.generate().toString(),
      },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
    const expectation = expect(guard.canActivate(context));

    await expectation.rejects.toThrowWithMessage(
      AccessDeniedException,
      "Token does not have access to the requested company.",
    );
    await expectation.rejects.toContainEntry(["reason", AccessDeniedReason.NOT_ALLOWED]);

    expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
    expect(tokenProvider.validate).toHaveBeenCalledWith(token);
  });

  it("should deny access to unauthorized routes", async () => {
    const context = mock<ExecutionContext>();
    const companyId = CompanyId.generate();
    const token = tokenProvider.issue(UserId.generate(), {
      scope: [TokenScope.AUTH],
      companies: [companyId],
    });
    const request = mock<Request>({
      signedCookies: {
        [authCookie]: token.toString(),
        [companyCookie]: companyId.toString(),
      },
    });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);

    reflector.getAllAndOverride.mockReturnValueOnce(false);
    reflector.get.mockReturnValueOnce([RoomPermission.DELETE]);
    authorizer.validate.mockResolvedValueOnce(false);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    jest.spyOn(tokenProvider, "validate");

    // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
    const expectation = expect(guard.canActivate(context));

    await expectation.rejects.toThrowWithMessage(
      AccessDeniedException,
      `The user "${token.userId}" does not have the required permissions: [${RoomPermission.DELETE}]`,
    );
    await expectation.rejects.toContainEntry([
      "reason",
      AccessDeniedReason.INSUFFICIENT_PERMISSIONS,
    ]);

    expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
    expect(tokenProvider.validate).toHaveBeenCalledWith(token);

    expect(authorizer.validate).toHaveBeenCalledTimes(1);
    expect(authorizer.validate).toHaveBeenCalledWith(
      companyId,
      token.userId,
      RoomPermission.DELETE,
    );
  });
});
