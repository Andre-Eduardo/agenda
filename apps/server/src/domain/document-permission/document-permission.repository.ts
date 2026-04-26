import type {ClinicMemberId} from '../clinic-member/entities';
import type {DocumentEntityType, DocumentPermission, DocumentPermissionId} from './entities';

export interface DocumentPermissionRepository {
    findById(id: DocumentPermissionId): Promise<DocumentPermission | null>;
    findByMemberAndEntity(
        memberId: ClinicMemberId,
        entityType: DocumentEntityType,
        entityId: string,
    ): Promise<DocumentPermission | null>;
    findByEntity(entityType: DocumentEntityType, entityId: string): Promise<DocumentPermission[]>;
    save(permission: DocumentPermission): Promise<void>;
    deleteMany(entityType: DocumentEntityType, entityId: string): Promise<void>;
}

export abstract class DocumentPermissionRepository {}
