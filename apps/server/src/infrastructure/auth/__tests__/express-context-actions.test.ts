import type { CookieOptions, Response } from "express";
import { mock } from "jest-mock-extended";
import { CompanyId } from "../../../domain/company/entities";
import type { Token } from "../../../domain/user/token";
import { ExpressContextActions } from "../express-context-actions";

describe("Express context actions", () => {
  const response = mock<Response>();
  const authCookie = "authCookieName";
  const companyCookie = "companyCookieName";
  const cookieOptions: CookieOptions = {
    domain: "example.com",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    signed: true,
  };

  const expressContextActions = new ExpressContextActions(
    response,
    authCookie,
    companyCookie,
    cookieOptions,
  );

  it("should store the token in the cookies", () => {
    const token = {} as Token;

    expressContextActions.setToken(token);

    expect(response.cookie).toHaveBeenCalledWith(authCookie, token.toString(), {
      ...cookieOptions,
      expires: token.expirationTime,
    });

    expect(response.clearCookie).not.toHaveBeenCalled();
  });

  it("should clear the token from the cookies", () => {
    expressContextActions.setToken(null);

    expect(response.clearCookie).toHaveBeenCalledWith(authCookie, {
      ...cookieOptions,
      expires: undefined,
    });
  });

  it("should store the current company in the cookies", () => {
    const companyId = CompanyId.generate();

    expressContextActions.setCompany(companyId);

    expect(response.cookie).toHaveBeenCalledWith(companyCookie, companyId.toString(), {
      ...cookieOptions,
      maxAge: 7 * 24 * 3600 * 1000,
    });

    expect(response.clearCookie).not.toHaveBeenCalled();
  });

  it("should clear the current company from the cookies", () => {
    expressContextActions.setCompany(null);

    expect(response.clearCookie).toHaveBeenCalledWith(companyCookie, {
      ...cookieOptions,
      maxAge: undefined,
    });
  });
});
