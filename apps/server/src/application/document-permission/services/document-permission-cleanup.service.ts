import {Injectable} from '@nestjs/common';
import {DocumentPermissionRepository} from '../../../domain/document-permission/document-permission.repository';
import {DocumentEntityType} from '../../../domain/document-permission/entities';

/**
 * Purges all DocumentPermission records linked to a soft-deleted entity.
 * Call from soft-delete services for: Record, File, ImportedDocument,
 * PatientForm, ClinicalProfile, PatientAlert.
 */
@Injectable()
export class DocumentPermissionCleanupService {
    constructor(private readonly permissionRepository: DocumentPermissionRepository) {}

    async cleanupForEntity(entityType: DocumentEntityType, entityId: string): Promise<void> {
        await this.permissionRepository.deleteMany(entityType, entityId);
    }
}
