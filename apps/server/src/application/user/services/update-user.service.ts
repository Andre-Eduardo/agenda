import {Injectable} from '@nestjs/common';
import {
    AccessDeniedException,
    AccessDeniedReason,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {DuplicateEmailException, DuplicateUsernameException} from '../../../domain/user/user.exceptions';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {UpdateUserDto, UserDto} from '../dtos';

@Injectable()
export class UpdateUserService implements ApplicationService<UpdateUserDto, UserDto> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {currentPassword, ...payload}}: Command<UpdateUserDto>): Promise<UserDto> {
        const user = await this.userRepository.findById(payload.id);

        if (user === null) {
            throw new ResourceNotFoundException('User not found.', payload.id.toString());
        }

        if (!(await user.password.verify(currentPassword))) {
            throw new AccessDeniedException('Incorrect password.', AccessDeniedReason.BAD_CREDENTIALS);
        }

        user.change(payload);

        try {
            await this.userRepository.save(user);
        } catch (e) {
            if (e instanceof DuplicateUsernameException) {
                throw new PreconditionException('Cannot update the user with a username already in use.');
            }

            if (e instanceof DuplicateEmailException) {
                throw new PreconditionException('Cannot update the user with an email already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, user);

        return new UserDto(user);
    }
}
