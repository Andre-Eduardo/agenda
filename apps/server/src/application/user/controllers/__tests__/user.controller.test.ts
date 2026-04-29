import { mock } from "jest-mock-extended";
import type { Actor, UnauthenticatedActor } from "../../../../domain/@shared/actor";
import { Email } from "../../../../domain/@shared/value-objects";
import { GlobalRole } from "../../../../domain/auth";
import { CompanyId } from "../../../../domain/company/entities";
import { User, UserId } from "../../../../domain/user/entities";
import { fakeUser } from "../../../../domain/user/entities/__tests__/fake-user";
import { ObfuscatedPassword, Username } from "../../../../domain/user/value-objects";
import { UserDto } from "../../dtos";
import type {
  ChangeUserPasswordService,
  DeleteUserService,
  GetUserService,
  SignUpUserService,
  UpdateUserService,
} from "../../services";
import { UserController } from "../user.controller";

describe("A user controller", () => {
  const signUpUserServiceMock = mock<SignUpUserService>();
  const getUserServiceMock = mock<GetUserService>();
  const updateUserServiceMock = mock<UpdateUserService>();
  const changeUserPasswordServiceMock = mock<ChangeUserPasswordService>();
  const deleteUserServiceMock = mock<DeleteUserService>();
  const userController = new UserController(
    signUpUserServiceMock,
    getUserServiceMock,
    updateUserServiceMock,
    changeUserPasswordServiceMock,
    deleteUserServiceMock,
  );

  const actor: Actor = {
    userId: UserId.generate(),
    ip: "127.0.0.1",
  };

  describe("when signing up a user", () => {
    it("should repass the responsibility to the right service", async () => {
      const unauthenticatedActor: UnauthenticatedActor = {
        userId: null,
        ip: "127.0.0.1",
      };

      const payload = {
        firstName: "John",
        lastName: "Doe",
        email: Email.create("john.doe@example.com"),
        username: Username.create("johndoe"),
        password: "@SecurePassword123",
      };

      const expectedUser = new UserDto(await User.signUp(payload));

      jest.spyOn(signUpUserServiceMock, "execute").mockResolvedValueOnce(expectedUser);

      await expect(userController.signUp(unauthenticatedActor, payload)).resolves.toEqual(
        expectedUser,
      );

      expect(signUpUserServiceMock.execute).toHaveBeenCalledWith({
        actor: unauthenticatedActor,
        payload,
      });
    });
  });

  describe("when getting a user", () => {
    it("should repass the responsibility to the right service", async () => {
      const existingUser = fakeUser({
        id: UserId.generate(),
        firstName: "John",
        lastName: "Doe",
        email: Email.create("john.doe@example.com"),
        username: Username.create("johndoe"),
        password: await ObfuscatedPassword.obfuscate("@SecurePassword123"),
        globalRole: GlobalRole.NONE,
        companies: [CompanyId.generate()],
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
      });

      const expectedUser = new UserDto(existingUser);

      jest.spyOn(getUserServiceMock, "execute").mockResolvedValueOnce(expectedUser);

      await expect(userController.getUser(actor, existingUser.id)).resolves.toEqual(expectedUser);

      expect(getUserServiceMock.execute).toHaveBeenCalledWith({
        actor,
        payload: { id: existingUser.id },
      });
    });
  });

  describe("when getting the current user", () => {
    it("should repass the responsibility to the right service", async () => {
      const existingUser = fakeUser({
        id: actor.userId,
        firstName: "John",
        lastName: "Doe",
        email: null,
        username: Username.create("johndoe"),
        password: await ObfuscatedPassword.obfuscate("@SecurePassword123"),
        globalRole: GlobalRole.NONE,
        companies: [CompanyId.generate()],
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
      });

      const expectedUser = new UserDto(existingUser);

      jest.spyOn(getUserServiceMock, "execute").mockResolvedValueOnce(expectedUser);

      await expect(userController.getCurrentUser(actor)).resolves.toEqual(expectedUser);

      expect(getUserServiceMock.execute).toHaveBeenCalledWith({
        actor,
        payload: { id: existingUser.id },
      });
    });
  });

  describe("when updating a user", () => {
    it("should repass the responsibility to the right service", async () => {
      const existingUser = fakeUser({
        id: UserId.generate(),
        firstName: "John",
        lastName: "Doe",
        email: Email.create("john.doe@example.com"),
        username: Username.create("johndoe"),
        password: await ObfuscatedPassword.obfuscate("@SecurePassword123"),
        globalRole: GlobalRole.NONE,
        companies: [CompanyId.generate()],
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
      });
      const payload = {
        firstName: "Jorge",
        lastName: null,
        email: Email.create("john.doe@example.com"),
        username: Username.create("johndoe"),
        currentPassword: "@SecurePassword123",
      };

      const expectedUser = new UserDto(existingUser);

      jest.spyOn(updateUserServiceMock, "execute").mockResolvedValueOnce(expectedUser);

      await expect(userController.updateUser(actor, existingUser.id, payload)).resolves.toEqual(
        expectedUser,
      );

      expect(updateUserServiceMock.execute).toHaveBeenCalledWith({
        actor,
        payload: { id: existingUser.id, ...payload },
      });
    });
  });

  describe("when updating the user password", () => {
    it("should repass the responsibility to the right service", async () => {
      const payload = {
        oldPassword: "@SecurePassword123",
        newPassword: "@Password123",
      };

      await userController.changeUserPassword(actor, payload);

      expect(changeUserPasswordServiceMock.execute).toHaveBeenCalledWith({ actor, payload });
    });
  });

  describe("when deleting a user", () => {
    it("should repass the responsibility to the right service", async () => {
      const id = UserId.generate();
      const payload = {
        password: "@SecurePassword123",
      };

      await userController.deleteUser(actor, id, payload);

      expect(deleteUserServiceMock.execute).toHaveBeenCalledWith({
        actor,
        payload: { id, ...payload },
      });
    });
  });
});
