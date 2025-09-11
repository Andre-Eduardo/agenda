import {Injectable} from '@nestjs/common';
import {AccessDeniedException, AccessDeniedReason} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ChangeUserPasswordDto} from '../dtos';

@Injectable()
export class ChangeUserPasswordService implements ApplicationService<ChangeUserPasswordDto> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<ChangeUserPasswordDto>): Promise<void> {
        const {oldPassword, newPassword} = payload;

        const user = await this.userRepository.findById(actor.userId);

        if (user === null) {
            throw new Error('User not found.');
        }

        if (!(await user.password.verify(oldPassword))) {
            throw new AccessDeniedException('Incorrect password.', AccessDeniedReason.BAD_CREDENTIALS);
        }

        await user.changePassword(newPassword);

        await this.userRepository.save(user);

        this.eventDispatcher.dispatch(actor, user);
    }
}
