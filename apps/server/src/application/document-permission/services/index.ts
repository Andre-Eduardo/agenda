export {DocumentPermissionCleanupService} from './document-permission-cleanup.service';
import {Injectable} from '@nestjs/common';
import {ClinicId} from '../../../domain/clinic/entities';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {DocumentPermission} from '../../../domain/document-permission/entities';
import {DocumentPermissionRepository} from '../../../domain/document-permission/document-permission.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DocumentPermissionDto, GrantDocumentPermissionDto} from '../dtos';

@Injectable()
export class GrantDocumentPermissionService
    implements ApplicationService<GrantDocumentPermissionDto, DocumentPermissionDto>
{
    constructor(
        private readonly permissionRepository: DocumentPermissionRepository,
        private readonly eventDispatcher: EventDispatcher,
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
