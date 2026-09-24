import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {DocumentEntityType, DocumentPermission, DocumentPermissionId} from '@domain/document-permission/entities';

export interface DocumentPermissionRepository {
    findTargetClinic(entityType: DocumentEntityType, entityId: string): Promise<ClinicId | null>;
    findById(id: DocumentPermissionId): Promise<DocumentPermission | null>;
    findByMemberAndEntity(
        memberId: ClinicMemberId,
        entityType: DocumentEntityType,
        entityId: string
    ): Promise<DocumentPermission | null>;
    findByEntity(entityType: DocumentEntityType, entityId: string): Promise<DocumentPermission[]>;
    findByMemberAndType(
        clinicId: ClinicId,
        memberId: ClinicMemberId,
        entityType: DocumentEntityType
    ): Promise<DocumentPermission[]>;
    save(permission: DocumentPermission): Promise<void>;
    deleteMany(entityType: DocumentEntityType, entityId: string): Promise<void>;
}

export abstract class DocumentPermissionRepository {}
