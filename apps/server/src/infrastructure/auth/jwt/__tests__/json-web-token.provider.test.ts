import { UserId } from "../../../../domain/user/entities";
import type { Token } from "../../../../domain/user/token";
import { TokenScope } from "../../../../domain/user/token";
import { JsonWebTokenProvider } from "../json-web-token.provider";

describe("A JSON Web Token provider", () => {
  const defaultExpiration = 60;
  const provider = new JsonWebTokenProvider(defaultExpiration, "super-secret");

  const now = new Date(1000);

  beforeEach(() => {
    jest.useFakeTimers({ now });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should issue a token", () => {
    const userId = UserId.generate();

    const token = provider.issue(userId, {
      scope: [TokenScope.AUTH],
      metadata: {
        username: "john.doe",
      },
    });

    expect(token.userId).toEqual(userId);
    expect(token.issueTime).toEqual(now);
    expect(token.expirationTime).toEqual(new Date(now.getTime() + defaultExpiration * 1000));
    expect(token.scope).toEqual([TokenScope.AUTH]);
    expect(token.metadata).toEqual({
      username: "john.doe",
    });
  });

  it("should issue a token with a custom expiration", () => {
    const userId = UserId.generate();

    const token = provider.issue(userId, { expiration: 120 });

    expect(token.userId).toEqual(userId);
    expect(token.issueTime).toEqual(now);
    expect(token.expirationTime).toEqual(new Date(now.getTime() + 120 * 1000));
    expect(token.scope).toEqual([]);
    expect(token.metadata).toEqual(undefined);
  });

  it("should validate a token", () => {
    const validToken = provider.issue(UserId.generate());
    const invalidToken = provider.issue(UserId.generate(), { expiration: 0 });
    const unknownToken = {} as Token;

    expect(provider.validate(validToken)).toBe(true);
    expect(provider.validate(invalidToken)).toBe(false);
    expect(provider.validate(unknownToken)).toBe(false);
  });

  it("should parse a token", () => {
    const token = provider.issue(UserId.generate());

    const parsedToken = provider.parse(token.toString());

    expect(parsedToken.userId).toEqual(token.userId);
    expect(parsedToken.issueTime).toEqual(token.issueTime);
    expect(parsedToken.expirationTime).toEqual(token.expirationTime);
    expect(parsedToken.scope).toEqual(token.scope);
    expect(parsedToken.metadata).toEqual(token.metadata);
  });
});
