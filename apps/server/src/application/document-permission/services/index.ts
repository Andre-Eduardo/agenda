import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {DocumentPermissionDto, GrantDocumentPermissionDto} from '@application/document-permission/dtos';
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
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<GrantDocumentPermissionDto>): Promise<DocumentPermissionDto> {
        const permission = DocumentPermission.create({
            clinicId: ClinicId.from(payload.clinicId),
            memberId: ClinicMemberId.from(payload.memberId),
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
