import {Inject, Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AuditLogRepository} from '@domain/audit/audit-log.repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';

export const SUPPORT_ACCESS_LEAVE_ACTION = 'SUPPORT_ACCESS:LEAVE';

/** Registra a saída do suporte da clínica; o controller limpa a clínica da sessão. */
@Injectable()
export class LeaveSupportAccessService implements ApplicationService {
    constructor(
        private readonly clinicMemberRepository: ClinicMemberRepository,
        // AuditLogRepository is an interface + Symbol token: tsc emits `Object` as metadata, so inject explicitly.
        @Inject(AuditLogRepository) private readonly auditLogRepository: AuditLogRepository
    ) {}

    async execute({actor}: Command): Promise<void> {
        // Bypass route: outside a clinic there is nothing to leave.
        if (actor.clinicMemberId === null) return;

        const member = await this.clinicMemberRepository.findById(actor.clinicMemberId);

        if (member === null || !member.supportAccess || !member.userId.equals(actor.userId)) return;

        await this.auditLogRepository.append({
            clinicId: member.clinicId.toString(),
            actorUserId: actor.userId.toString(),
            actorMemberId: member.id.toString(),
            resource: 'SupportAccess',
            resourceId: member.clinicId.toString(),
            action: SUPPORT_ACCESS_LEAVE_ACTION,
            result: 'SUCCESS',
            statusCode: 204,
            ip: actor.ip,
        });
    }
}
