import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';

@Injectable()
export class SignOutService implements ApplicationService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor}: Command): Promise<void> {
        const user = await this.userRepository.findById(actor.userId);

        if (user === null) {
            throw new ResourceNotFoundException('User not found.', actor.userId.toString());
        }

        user.signOut();

        this.eventDispatcher.dispatch(actor, user);
    }
}
