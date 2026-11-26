import {Inject, Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicMemberDto} from '@application/clinic-member/dtos';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {AuditLogRepository} from '@domain/audit/audit-log.repository';
import {canAccessAllClinics} from '@domain/auth';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import type {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {UserRepository} from '@domain/user/user.repository';

export type EnterSupportAccessInput = {clinicId: ClinicId};

export const SUPPORT_ACCESS_ENTER_ACTION = 'SUPPORT_ACCESS:ENTER';

/**
 * Coloca um usuário global (SUPPORT/SUPER_ADMIN) dentro de uma clínica de que ele não é
 * funcionário, como no "entrar na empresa" do suporte do plexter.
 *
 * Aqui toda ação precisa de um ClinicMember (autoria, auditoria), então a primeira entrada cria
 * um vínculo técnico de suporte (ClinicMember.supportAccess): sem papel de clínica, fora da equipe
 * e da licença. Se o usuário já é funcionário da clínica, entra pelo vínculo dele. Cada entrada
 * fica registrada no log de auditoria da clínica.
 */
@Injectable()
export class EnterSupportAccessService implements ApplicationService<EnterSupportAccessInput, ClinicMemberDto> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly clinicRepository: ClinicRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        // AuditLogRepository is an interface + Symbol token: tsc emits `Object` as metadata, so inject explicitly.
        @Inject(AuditLogRepository) private readonly auditLogRepository: AuditLogRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<EnterSupportAccessInput>): Promise<ClinicMemberDto> {
        const user = await this.userRepository.findById(actor.userId);

        if (user === null || !canAccessAllClinics(user.globalRole)) {
            throw new AccessDeniedException(
                'Only global support users can enter any clinic.',
                AccessDeniedReason.NOT_ALLOWED
            );
        }

        const clinic = await this.clinicRepository.findById(payload.clinicId);

        if (clinic === null) {
            throw new ResourceNotFoundException('clinic.not_found', payload.clinicId.toString());
        }

        const existing = await this.clinicMemberRepository.findByClinicAndUser(clinic.id, user.id);
        let member: ClinicMember;

        if (existing === null) {
            member = ClinicMember.createSupportAccess({
                clinicId: clinic.id,
                userId: user.id,
                displayName: `${user.name} (suporte)`,
            });
        } else if (existing.supportAccess) {
            member = existing;

            if (!member.isActive) member.change({isActive: true});
        } else if (existing.isActive) {
            // Funcionário da própria clínica: entra pelo vínculo normal, com o papel dele.
            member = existing;
        } else {
            throw new AccessDeniedException(
                'Your membership in this clinic is no longer active.',
                AccessDeniedReason.NOT_ALLOWED
            );
        }

        await this.clinicMemberRepository.save(member);
        this.eventDispatcher.dispatch({...actor, clinicId: clinic.id, clinicMemberId: member.id}, member);

        await this.auditLogRepository.append({
            clinicId: clinic.id.toString(),
            actorUserId: user.id.toString(),
            actorMemberId: member.id.toString(),
            resource: 'SupportAccess',
            resourceId: clinic.id.toString(),
            action: SUPPORT_ACCESS_ENTER_ACTION,
            result: 'SUCCESS',
            statusCode: 200,
            ip: actor.ip,
        });

        return new ClinicMemberDto(member);
    }
}
