import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ChangeClinicAccountTypeDto, ClinicDto} from '@application/clinic/dtos';
import {
    AccessDeniedException,
    AccessDeniedReason,
    PreconditionException,
    ResourceNotFoundException,
} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {AuditLogRepository} from '@domain/audit/audit-log.repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicAccountType} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';

export const ACCOUNT_TYPE_CHANGE_ACTION = 'CLINIC_ACCOUNT_TYPE:CHANGE';
export const ONLY_OWNER_CHANGES_ACCOUNT_TYPE = 'Only the account owner can change the account type.';
export const TEAM_ACCESS_CONFIRMATION_REQUIRED =
    'Confirm that team members you add may be given access to the patients of this account (confirmTeamAccess).';

/**
 * Autônomo vira clínica (abre equipe e recepção) ou clínica volta a ser autônomo.
 * Só o dono decide. Nenhum dado muda de lugar: só os módulos de clínica ligam ou desligam.
 */
@Injectable()
export class ChangeClinicAccountTypeService implements ApplicationService<ChangeClinicAccountTypeDto, ClinicDto> {
    constructor(
        private readonly clinicRepository: ClinicRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly auditLogRepository: AuditLogRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<ChangeClinicAccountTypeDto>): Promise<ClinicDto> {
        const clinic = await this.clinicRepository.findById(actor.clinicId);

        if (clinic === null) throw new ResourceNotFoundException('clinic.not_found', actor.clinicId.toString());

        const current = await this.clinicMemberRepository.findById(actor.clinicMemberId);

        if (current === null || current.supportAccess || !current.roles.includes(ClinicMemberRole.OWNER)) {
            throw new AccessDeniedException(ONLY_OWNER_CHANGES_ACCOUNT_TYPE, AccessDeniedReason.NOT_ALLOWED);
        }

        if (payload.accountType === clinic.accountType) return new ClinicDto(clinic);

        if (payload.accountType === ClinicAccountType.CLINIC && !payload.confirmTeamAccess) {
            throw new PreconditionException(TEAM_ACCESS_CONFIRMATION_REQUIRED);
        }

        const members = await this.clinicMemberRepository.findByClinicId(clinic.id);
        const activeMembers = members.filter((member) => member.isActive && !member.supportAccess).length;

        clinic.changeAccountType(payload.accountType, activeMembers);

        await this.clinicRepository.save(clinic);
        this.eventDispatcher.dispatch(actor, clinic);

        await this.auditLogRepository.append({
            clinicId: clinic.id.toString(),
            actorUserId: actor.userId.toString(),
            actorMemberId: actor.clinicMemberId.toString(),
            resource: 'Clinic',
            resourceId: clinic.id.toString(),
            action: `${ACCOUNT_TYPE_CHANGE_ACTION}:${payload.accountType}`,
            result: 'SUCCESS',
            statusCode: 200,
            ip: actor.ip,
        });

        return new ClinicDto(clinic);
    }
}
