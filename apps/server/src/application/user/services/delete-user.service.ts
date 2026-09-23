import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {DeleteUserDto} from '@application/user/dtos';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import type {ClinicMember} from '@domain/clinic-member/entities';
import {EventDispatcher} from '@domain/event';
import type {User} from '@domain/user/entities';
import {UserRepository} from '@domain/user/user.repository';

type DeletedUser = {user: User; revokedMembers: ClinicMember[]};

@Injectable()
export class DeleteUserService implements ApplicationService<DeleteUserDto> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteUserDto>): Promise<void> {
        const {user, revokedMembers} = await this.softDelete(payload);

        // Events are recorded after the transaction ends: the recorder would otherwise write on a closed transaction.
        for (const member of revokedMembers) {
            this.eventDispatcher.dispatch(actor, member);
        }

        this.eventDispatcher.dispatch(actor, user);
    }

    /**
     * Soft delete keeps the row, so a token issued before the deletion would still resolve the user's clinic
     * memberships. They are revoked in the same transaction so the deleted user loses access to every clinic.
     */
    @Transactional()
    private async softDelete(payload: DeleteUserDto): Promise<DeletedUser> {
        const user = await this.userRepository.findById(payload.id);

        if (user === null) {
            throw new ResourceNotFoundException('User not found.', payload.id.toString());
        }

        if (!(await user.password.verify(payload.password))) {
            throw new AccessDeniedException('Incorrect password.', AccessDeniedReason.BAD_CREDENTIALS);
        }

        user.delete();

        await this.userRepository.delete(user.id);

        const revokedMembers = await this.clinicMemberRepository.findByUserId(user.id);

        for (const member of revokedMembers) {
            member.delete();

            await this.clinicMemberRepository.save(member);
        }

        return {user, revokedMembers};
    }
}
