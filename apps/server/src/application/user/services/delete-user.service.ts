import {Injectable} from '@nestjs/common';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteUserDto} from '../dtos';

@Injectable()
export class DeleteUserService implements ApplicationService<DeleteUserDto> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteUserDto>): Promise<void> {
        const user = await this.userRepository.findById(payload.id);

        if (user === null) {
            throw new ResourceNotFoundException('User not found.', payload.id.toString());
        }

        if (!(await user.password.verify(payload.password))) {
            throw new AccessDeniedException('Incorrect password.', AccessDeniedReason.BAD_CREDENTIALS);
        }

        user.delete();

        await this.userRepository.delete(user.id);

        this.eventDispatcher.dispatch(actor, user);
    }
}
