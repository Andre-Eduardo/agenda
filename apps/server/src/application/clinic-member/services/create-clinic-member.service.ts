import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {ClinicMemberDto, CreateClinicMemberDto} from '@application/clinic-member/dtos';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ClinicLicense, SeatDecision} from '@domain/clinic-license/entities';
import {countProfessionalSeats, occupiesProfessionalSeat} from '@domain/clinic-license/services';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {UserId} from '@domain/user/entities';

export const SOLO_ACCOUNT_HAS_NO_TEAM =
    'A solo account has a single member. Switch it to a clinic account to add a team.';

@Injectable()
export class CreateClinicMemberService implements ApplicationService<CreateClinicMemberDto, ClinicMemberDto> {
    constructor(
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly clinicRepository: ClinicRepository,
        private readonly clinicLicenseRepository: ClinicLicenseRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<CreateClinicMemberDto>): Promise<ClinicMemberDto> {
        const clinicId = ClinicId.from(payload.clinicId);
        const clinic = await this.clinicRepository.findById(clinicId);

        if (clinic === null) throw new ResourceNotFoundException('clinic.not_found', payload.clinicId);

        const members = await this.clinicMemberRepository.findByClinicId(clinicId);

        // Conta SOLO é de uma pessoa só: equipe exige passar a conta para CLINIC.
        if (clinic.isSolo() && members.some((member) => !member.supportAccess && member.deletedAt === null)) {
            throw new AccessDeniedException(SOLO_ACCOUNT_HAS_NO_TEAM, AccessDeniedReason.MODULE_NOT_ENABLED);
        }

        if (members.length === 0) {
            if (
                clinic.createdByUserId === null ||
                !clinic.createdByUserId.equals(actor.userId) ||
                payload.userId !== actor.userId.toString()
            ) {
                throw new AccessDeniedException(
                    'Only the clinic creator can create its first member.',
                    AccessDeniedReason.NOT_ALLOWED
                );
            }
        } else {
            if (actor.clinicMemberId === null || actor.clinicId === null) {
                throw new AccessDeniedException('Clinic manager required.', AccessDeniedReason.NOT_ALLOWED);
            }

            assertEntityBelongsToClinic(clinicId, actor.clinicId);
            const currentMember = await this.clinicMemberRepository.findById(actor.clinicMemberId);

            if (
                currentMember === null ||
                !currentMember.isActive ||
                !currentMember.userId.equals(actor.userId) ||
                !currentMember.clinicId.equals(clinicId) ||
                !currentMember.roles.some((role) => role === ClinicMemberRole.OWNER || role === ClinicMemberRole.ADMIN)
            ) {
                throw new AccessDeniedException('Clinic manager required.', AccessDeniedReason.NOT_ALLOWED);
            }
        }

        const member = ClinicMember.create({
            clinicId,
            userId: UserId.from(payload.userId),
            roles: payload.roles,
            displayName: payload.displayName ?? null,
            color: payload.color ?? null,
            isActive: true,
            invitedByMemberId: actor.clinicMemberId ? ClinicMemberId.from(actor.clinicMemberId.toString()) : null,
        });

        await this.reserveProfessionalSeat(actor, member, members, payload.acceptExtraCharge);
        await this.clinicMemberRepository.save(member);
        this.eventDispatcher.dispatch(actor, member);

        return new ClinicMemberDto(member);
    }

    private async reserveProfessionalSeat(
        actor: Command<CreateClinicMemberDto>['actor'],
        member: ClinicMember,
        members: ClinicMember[],
        acceptExtraCharge: boolean
    ): Promise<void> {
        if (!occupiesProfessionalSeat(member)) return;

        const license =
            (await this.clinicLicenseRepository.findByClinicId(member.clinicId)) ??
            ClinicLicense.create({clinicId: member.clinicId});
        const decision = license.reserveProfessionalSeat(countProfessionalSeats(members), {acceptExtraCharge});

        if (decision === SeatDecision.EXTRA_CHARGE) {
            await this.clinicLicenseRepository.save(license);
            this.eventDispatcher.dispatch({...actor, clinicId: member.clinicId}, license);
        }
    }
}
