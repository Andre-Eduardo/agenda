import { Injectable } from "@nestjs/common";
import { UnauthenticatedActor } from "@domain/@shared/actor";
import { PreconditionException } from "@domain/@shared/exceptions";
import { EventDispatcher } from "@domain/event";
import { User } from "@domain/user/entities";
import { DuplicateEmailException, DuplicateUsernameException } from "@domain/user/user.exceptions";
import { UserRepository } from "@domain/user/user.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { SignUpUserDto, UserDto } from "@application/user/dtos";

@Injectable()
export class SignUpUserService implements ApplicationService<
  SignUpUserDto,
  UserDto,
  UnauthenticatedActor
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({
    actor,
    payload,
  }: Command<SignUpUserDto, UnauthenticatedActor>): Promise<UserDto> {
    const user = await User.signUp(payload);

    try {
      await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof DuplicateUsernameException) {
        throw new PreconditionException("Cannot create a user with a username already in use.");
      }

      if (error instanceof DuplicateEmailException) {
        throw new PreconditionException("Cannot create a user with an email already in use.");
      }

      throw error;
    }

    this.eventDispatcher.dispatch({ ...actor, userId: user.id }, user);

    return new UserDto(user);
  }
}
