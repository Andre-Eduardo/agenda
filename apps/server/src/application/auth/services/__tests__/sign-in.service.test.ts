import { mock } from "jest-mock-extended";
import type { UnauthenticatedActor } from "../../../../domain/@shared/actor";
import { AccessDeniedException, AccessDeniedReason } from "../../../../domain/@shared/exceptions";
import { Email } from "../../../../domain/@shared/value-objects";
import { GlobalRole } from "../../../../domain/auth";
import { CompanyId } from "../../../../domain/company/entities";
import type { EventDispatcher } from "../../../../domain/event";
import { UserId } from "../../../../domain/user/entities";
import { fakeUser } from "../../../../domain/user/entities/__tests__/fake-user";
import { UserSignedInEvent } from "../../../../domain/user/events";
import type { TokenProvider } from "../../../../domain/user/token";
import { TokenScope } from "../../../../domain/user/token";
import type { UserRepository } from "../../../../domain/user/user.repository";
import { ObfuscatedPassword, Username } from "../../../../domain/user/value-objects";
import { JsonWebToken } from "../../../../infrastructure/auth/jwt";
import type { SignInDto } from "../../dtos";
import { SignInService } from "../index";

describe("A sign-in service", () => {
  const userRepository = mock<UserRepository>();
  const eventDispatcher = mock<EventDispatcher>();
  const tokenProvider = mock<TokenProvider>();
  const signInService = new SignInService(userRepository, tokenProvider, eventDispatcher);

  const actor: UnauthenticatedActor = {
    userId: null,
    ip: "127.0.0.1",
  };

  const now = new Date();

  beforeEach(() => {
    jest.useFakeTimers({ now });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should sign in to a user", async () => {
    const existingUser = fakeUser({
      id: UserId.generate(),
      firstName: "John",
      lastName: "Doe",
      email: Email.create("john.doe@example.com"),
      username: Username.create("johndoe"),
      password: await ObfuscatedPassword.obfuscate("@SecurePassword123"),
      globalRole: GlobalRole.OWNER,
      companies: [CompanyId.generate()],
      createdAt: new Date(1000),
      updatedAt: new Date(1000),
    });

    const payload: SignInDto = {
      username: Username.create("johndoe"),
      password: "@SecurePassword123",
    };

    const token = JsonWebToken.signed(
      {
        userId: existingUser.id,
        companies: existingUser.companies,
        scope: [TokenScope.AUTH],
        issueTime: now,
        expirationTime: new Date(now.getTime() + 3600 * 1000),
      },
      "secret",
    );

    jest.spyOn(existingUser, "signIn");
    jest.spyOn(userRepository, "findByUsername").mockResolvedValueOnce(existingUser);
    jest.spyOn(tokenProvider, "issue").mockReturnValue(token);

    await expect(signInService.execute({ actor, payload })).resolves.toEqual({
      token,
      companyId: existingUser.companies[0],
    });

    expect(existingUser.signIn).toHaveBeenCalledWith(payload.password);

    expect(existingUser.events).toHaveLength(1);
    expect(existingUser.events[0]).toBeInstanceOf(UserSignedInEvent);
    expect(existingUser.events).toEqual([
      {
        type: UserSignedInEvent.type,
        timestamp: now,
        userId: existingUser.id,
      },
    ]);

    expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
      {
        ...actor,
        userId: existingUser.id,
      },
      existingUser,
    );
  });

  it("should select the company the user is requesting for sign-in", async () => {
    const companyId = CompanyId.generate();
    const existingUser = fakeUser({
      id: UserId.generate(),
      firstName: "John",
      lastName: "Doe",
      email: Email.create("john.doe@example.com"),
      username: Username.create("johndoe"),
      password: await ObfuscatedPassword.obfuscate("@SecurePassword123"),
      globalRole: GlobalRole.NONE,
      companies: [companyId],
      createdAt: new Date(1000),
      updatedAt: new Date(1000),
    });

    const payload: SignInDto = {
      companyId,
      username: Username.create("johndoe"),
      password: "@SecurePassword123",
    };

    const token = JsonWebToken.signed(
      {
        userId: existingUser.id,
        companies: existingUser.companies,
        scope: [TokenScope.AUTH],
        issueTime: now,
        expirationTime: new Date(now.getTime() + 3600 * 1000),
      },
      "secret",
    );

    jest.spyOn(existingUser, "signIn");
    jest.spyOn(userRepository, "findByUsername").mockResolvedValueOnce(existingUser);
    jest.spyOn(tokenProvider, "issue").mockReturnValue(token);

    await expect(signInService.execute({ actor, payload })).resolves.toEqual({
      token,
      companyId,
    });

    expect(existingUser.signIn).toHaveBeenCalledWith(payload.password);

    expect(existingUser.events).toHaveLength(1);
    expect(existingUser.events[0]).toBeInstanceOf(UserSignedInEvent);
    expect(existingUser.events).toEqual([
      {
        type: UserSignedInEvent.type,
        timestamp: now,
        userId: existingUser.id,
      },
    ]);

    expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
      {
        ...actor,
        userId: existingUser.id,
      },
      existingUser,
    );
  });

  it("should select no company for owners with no companies", async () => {
    const existingUser = fakeUser({
      id: UserId.generate(),
      firstName: "John",
      lastName: "Doe",
      email: Email.create("john.doe@example.com"),
      username: Username.create("johndoe"),
      password: await ObfuscatedPassword.obfuscate("@SecurePassword123"),
      globalRole: GlobalRole.OWNER,
      companies: [],
      createdAt: new Date(1000),
      updatedAt: new Date(1000),
    });

    const payload: SignInDto = {
      username: Username.create("johndoe"),
      password: "@SecurePassword123",
    };

    const token = JsonWebToken.signed(
      {
        userId: existingUser.id,
        companies: existingUser.companies,
        scope: [TokenScope.AUTH],
        issueTime: now,
        expirationTime: new Date(now.getTime() + 3600 * 1000),
      },
      "secret",
    );

    jest.spyOn(existingUser, "signIn");
    jest.spyOn(userRepository, "findByUsername").mockResolvedValueOnce(existingUser);
    jest.spyOn(tokenProvider, "issue").mockReturnValue(token);

    await expect(signInService.execute({ actor, payload })).resolves.toEqual({
      token,
      companyId: undefined,
    });

    expect(existingUser.signIn).toHaveBeenCalledWith(payload.password);

    expect(existingUser.events).toHaveLength(1);
    expect(existingUser.events[0]).toBeInstanceOf(UserSignedInEvent);
    expect(existingUser.events).toEqual([
      {
        type: UserSignedInEvent.type,
        timestamp: now,
        userId: existingUser.id,
      },
    ]);

    expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
      {
        ...actor,
        userId: existingUser.id,
      },
      existingUser,
    );
  });

  it.each([CompanyId.generate(), undefined])(
    "should select the first company the user has access to",
    async (companyId) => {
      const existingUser = fakeUser({
        id: UserId.generate(),
        firstName: "John",
        lastName: "Doe",
        email: Email.create("john.doe@example.com"),
        username: Username.create("johndoe"),
        password: await ObfuscatedPassword.obfuscate("@SecurePassword123"),
        globalRole: GlobalRole.NONE,
        companies: [CompanyId.generate(), CompanyId.generate()],
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
      });

      const payload: SignInDto = {
        companyId,
        username: Username.create("johndoe"),
        password: "@SecurePassword123",
      };

      const token = JsonWebToken.signed(
        {
          userId: existingUser.id,
          companies: existingUser.companies,
          scope: [TokenScope.AUTH],
          issueTime: now,
          expirationTime: new Date(now.getTime() + 3600 * 1000),
        },
        "secret",
      );

      jest.spyOn(existingUser, "signIn");
      jest.spyOn(userRepository, "findByUsername").mockResolvedValueOnce(existingUser);
      jest.spyOn(tokenProvider, "issue").mockReturnValue(token);

      await expect(signInService.execute({ actor, payload })).resolves.toEqual({
        token,
        companyId: existingUser.companies[0],
      });

      expect(existingUser.signIn).toHaveBeenCalledWith(payload.password);

      expect(existingUser.events).toHaveLength(1);
      expect(existingUser.events[0]).toBeInstanceOf(UserSignedInEvent);
      expect(existingUser.events).toEqual([
        {
          type: UserSignedInEvent.type,
          timestamp: now,
          userId: existingUser.id,
        },
      ]);

      expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
        {
          ...actor,
          userId: existingUser.id,
        },
        existingUser,
      );
    },
  );

  it("should fail to sign in an unknown user", async () => {
    const payload: SignInDto = {
      username: Username.create("johndoe"),
      password: "@SecurePassword123",
    };

    jest.spyOn(userRepository, "findByUsername").mockResolvedValueOnce(null);

    // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
    const expectation = expect(signInService.execute({ actor, payload }));

    await expectation.rejects.toThrowWithMessage(
      AccessDeniedException,
      `No user found with username "${payload.username}".`,
    );
    await expectation.rejects.toContainEntry(["reason", AccessDeniedReason.UNKNOWN_USER]);

    expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("should fail to sign in a regular user without access to any company", async () => {
    const existingUser = fakeUser({
      id: UserId.generate(),
      firstName: "John",
      lastName: "Doe",
      email: Email.create("john.doe@example.com"),
      username: Username.create("johndoe"),
      password: await ObfuscatedPassword.obfuscate("@SecurePassword123"),
      globalRole: GlobalRole.NONE,
      companies: [],
      createdAt: new Date(1000),
      updatedAt: new Date(1000),
    });

    const payload: SignInDto = {
      username: Username.create("johndoe"),
      password: "@SecurePassword123",
    };

    jest.spyOn(userRepository, "findByUsername").mockResolvedValueOnce(existingUser);

    // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
    const expectation = expect(signInService.execute({ actor, payload }));

    await expectation.rejects.toThrowWithMessage(
      AccessDeniedException,
      `The user "${payload.username}" is not allowed to access the system.`,
    );
    await expectation.rejects.toContainEntry(["reason", AccessDeniedReason.NOT_ALLOWED]);

    expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
