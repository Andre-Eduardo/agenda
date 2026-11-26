import {Injectable} from '@nestjs/common';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {GlobalRole} from '@domain/auth/global-role';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberRole, type ClinicMemberId} from '@domain/clinic-member/entities';
import {DocumentEntityType} from '@domain/document-permission/entities';
import {PatientId} from '@domain/patient/entities';
import type {Record} from '@domain/record/entities';
import {UserRepository} from '@domain/user/user.repository';

type RecordAuthorScope = {kind: 'all'} | {kind: 'none'} | {kind: 'author'; memberId: ClinicMemberId};

@Injectable()
export class RecordAuthorAccess {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly memberRepository: ClinicMemberRepository,
        private readonly patientAccess: PatientAccessChecker
    ) {}

    async authorScope(actor: Actor): Promise<RecordAuthorScope> {
        const user = await this.userRepository.findById(actor.userId);

        if (user?.globalRole === GlobalRole.SUPER_ADMIN) return {kind: 'all'};

        const member = await this.memberRepository.findById(actor.clinicMemberId);

        if (
            !user ||
            !member?.isActive ||
            !member.clinicId.equals(actor.clinicId) ||
            !member.userId.equals(actor.userId) ||
            !member.roles.includes(ClinicMemberRole.PROFESSIONAL)
        ) {
            return {kind: 'none'};
        }

        return {kind: 'author', memberId: member.id};
    }

    async assertCanRead(actor: Actor, record: Record): Promise<void> {
        assertEntityBelongsToClinic(record.clinicId, actor.clinicId);
        const author = await this.authorScope(actor);

        if (author.kind === 'all') return;

        if (author.kind !== 'author' || !record.createdByMemberId.equals(author.memberId)) {
            throw new AccessDeniedException('Record access denied.', AccessDeniedReason.NOT_ALLOWED);
        }

        await this.patientAccess.assertCanReadDocument(
            actor,
            PatientId.from(record.patientId.toString()),
            DocumentEntityType.RECORD,
            record.id.toString()
        );
    }
}
