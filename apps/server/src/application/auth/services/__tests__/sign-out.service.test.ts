import { mock } from "jest-mock-extended";
import type { Actor } from "../../../../domain/@shared/actor";
import { ResourceNotFoundException } from "../../../../domain/@shared/exceptions";
import { Email } from "../../../../domain/@shared/value-objects";
import { GlobalRole } from "../../../../domain/auth";
import { CompanyId } from "../../../../domain/company/entities";
import type { EventDispatcher } from "../../../../domain/event";
import { UserId } from "../../../../domain/user/entities";
import { fakeUser } from "../../../../domain/user/entities/__tests__/fake-user";
import { UserSignedOutEvent } from "../../../../domain/user/events";
import type { UserRepository } from "../../../../domain/user/user.repository";
import { ObfuscatedPassword, Username } from "../../../../domain/user/value-objects";
import { SignOutService } from "../index";

describe("A sign-out service", () => {
  const userRepository = mock<UserRepository>();
  const eventDispatcher = mock<EventDispatcher>();
  const signOutService = new SignOutService(userRepository, eventDispatcher);

  const actor: Actor = {
    userId: UserId.generate(),
    ip: "127.0.0.1",
  };

  const now = new Date();

  beforeEach(() => {
    jest.useFakeTimers({ now });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should sign out a user", async () => {
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

    jest.spyOn(existingUser, "signOut");
    jest.spyOn(userRepository, "findById").mockResolvedValueOnce(existingUser);

    await signOutService.execute({ actor, payload: undefined });

    expect(existingUser.signOut).toHaveBeenCalled();

    expect(existingUser.events).toHaveLength(1);
    expect(existingUser.events[0]).toBeInstanceOf(UserSignedOutEvent);
    expect(existingUser.events).toEqual([
      {
        type: UserSignedOutEvent.type,
        timestamp: now,
        userId: existingUser.id,
      },
    ]);

    expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingUser);
  });

  it("should fail to sign out a non-existing user", async () => {
    jest.spyOn(userRepository, "findById").mockResolvedValueOnce(null);

    await expect(signOutService.execute({ actor, payload: undefined })).rejects.toThrowWithMessage(
      ResourceNotFoundException,
      "User not found.",
    );

    expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
