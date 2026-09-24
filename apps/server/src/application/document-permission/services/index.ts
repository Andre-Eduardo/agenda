import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {DocumentPermissionDto, GrantDocumentPermissionDto} from '@application/document-permission/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {DocumentPermissionRepository} from '@domain/document-permission/document-permission.repository';
import {DocumentPermission} from '@domain/document-permission/entities';
import {EventDispatcher} from '@domain/event';

export {DocumentPermissionCleanupService} from '@application/document-permission/services/document-permission-cleanup.service';

@Injectable()
export class GrantDocumentPermissionService implements ApplicationService<
    GrantDocumentPermissionDto,
    DocumentPermissionDto
> {
    constructor(
        private readonly permissionRepository: DocumentPermissionRepository,
        private readonly memberRepository: ClinicMemberRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<GrantDocumentPermissionDto>): Promise<DocumentPermissionDto> {
        const clinicId = ClinicId.from(payload.clinicId);
        const memberId = ClinicMemberId.from(payload.memberId);

        assertEntityBelongsToClinic(clinicId, actor.clinicId);
        const [member, targetClinicId] = await Promise.all([
            this.memberRepository.findById(memberId),
            this.permissionRepository.findTargetClinic(payload.entityType, payload.entityId),
        ]);

        if (member === null || !member.isActive || targetClinicId === null) {
            throw new ResourceNotFoundException('Member or document not found.');
        }

        assertEntityBelongsToClinic(member.clinicId, actor.clinicId);
        assertEntityBelongsToClinic(targetClinicId, actor.clinicId);

        const permission = DocumentPermission.create({
            clinicId,
            memberId,
            entityType: payload.entityType,
            entityId: payload.entityId,
            canView: payload.canView,
            grantedByMemberId: actor.clinicMemberId,
            reason: payload.reason ?? null,
        });

        await this.permissionRepository.save(permission);
        this.eventDispatcher.dispatch(actor, permission);

        return new DocumentPermissionDto(permission);
    }
}
