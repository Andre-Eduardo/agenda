import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {CreateSupportUserDto, SupportUserDto} from '@application/support-access/dtos';
import {PreconditionException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {User} from '@domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '@domain/user/user.exceptions';
import {UserRepository} from '@domain/user/user.repository';

/** Cria um usuário global de suporte (GlobalRole.SUPPORT), sem vínculo com nenhuma clínica. */
@Injectable()
export class CreateSupportUserService implements ApplicationService<CreateSupportUserDto, SupportUserDto> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateSupportUserDto>): Promise<SupportUserDto> {
        const user = await User.createSupport({
            name: payload.name,
            username: payload.username,
            email: payload.email ?? undefined,
            password: payload.password,
        });

        try {
            await this.userRepository.save(user);
        } catch (error) {
            if (error instanceof DuplicateUsernameException) {
                throw new PreconditionException('Cannot create a user with a username already in use.');
            }

            if (error instanceof DuplicateEmailException) {
                throw new PreconditionException('Cannot create a user with an email already in use.');
            }

            throw error;
        }

        this.eventDispatcher.dispatch(actor, user);

        return new SupportUserDto(user);
    }
}
