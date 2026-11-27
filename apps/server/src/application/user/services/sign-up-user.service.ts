import {timingSafeEqual} from 'node:crypto';
import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {SignUpUserDto, UserDto} from '@application/user/dtos';
import {UnauthenticatedActor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason, PreconditionException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {User} from '@domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '@domain/user/user.exceptions';
import {UserRepository} from '@domain/user/user.repository';
import {EnvConfigService, SignUpMode} from '@infrastructure/config';

export const SIGN_UP_CLOSED = 'Self sign-up is disabled. Ask the clinic to create your account.';
export const SIGN_UP_INVALID_INVITE = 'A valid invite code is required to sign up.';

@Injectable()
export class SignUpUserService implements ApplicationService<SignUpUserDto, UserDto, UnauthenticatedActor> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly eventDispatcher: EventDispatcher,
        private readonly config: EnvConfigService
    ) {}

    async execute({actor, payload}: Command<SignUpUserDto, UnauthenticatedActor>): Promise<UserDto> {
        this.assertSignUpAllowed(payload.inviteCode ?? null);

        const {inviteCode: _inviteCode, ...props} = payload;
        const user = await User.signUp(props);

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

        this.eventDispatcher.dispatch({...actor, userId: user.id}, user);

        return new UserDto(user);
    }

    /**
     * Self sign-up creates a GlobalRole.OWNER user, who can then create clinics. Outside
     * development it is closed by default (SIGN_UP_MODE), or gated by a shared invite code.
     */
    private assertSignUpAllowed(inviteCode: string | null): void {
        const {mode, inviteCode: expected} = this.config.signUp;

        assertSelfSignUpAllowed(mode, expected, inviteCode);
    }
}

/** Shared gate of every self sign-up flow (owner sign-up and solo onboarding). */
export function assertSelfSignUpAllowed(
    mode: SignUpMode,
    expected: string | undefined,
    inviteCode: string | null
): void {
    if (mode === SignUpMode.OPEN) return;

    if (mode === SignUpMode.CLOSED) {
        throw new AccessDeniedException(SIGN_UP_CLOSED, AccessDeniedReason.NOT_ALLOWED);
    }

    if (inviteCode === null || expected === undefined || !safeEqual(inviteCode, expected)) {
        throw new AccessDeniedException(SIGN_UP_INVALID_INVITE, AccessDeniedReason.NOT_ALLOWED);
    }
}

function safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);

    return left.length === right.length && timingSafeEqual(left, right);
}
