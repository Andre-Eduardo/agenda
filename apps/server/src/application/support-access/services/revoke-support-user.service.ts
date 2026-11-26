import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {GlobalRole} from '@domain/auth';
import {EventDispatcher} from '@domain/event';
import type {UserId} from '@domain/user/entities';
import {UserRepository} from '@domain/user/user.repository';

export type RevokeSupportUserInput = {id: UserId};

/**
 * Tira o papel de suporte. O AuthGuard confere o papel global a cada request de um acesso de
 * suporte, então o usuário perde as clínicas na hora, mesmo com a sessão aberta.
 */
@Injectable()
export class RevokeSupportUserService implements ApplicationService<RevokeSupportUserInput> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<RevokeSupportUserInput>): Promise<void> {
        const user = await this.userRepository.findById(payload.id);

        if (user === null || user.globalRole !== GlobalRole.SUPPORT) {
            throw new ResourceNotFoundException('user.not_found', payload.id.toString());
        }

        user.revokeSupport();
        await this.userRepository.save(user);
        this.eventDispatcher.dispatch(actor, user);
    }
}
