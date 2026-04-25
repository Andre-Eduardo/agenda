import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {ClinicId} from '../../domain/clinic/entities';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {
    DocumentEntityType,
    DocumentPermission,
    DocumentPermissionId,
} from '../../domain/document-permission/entities';
import {MapperWithoutDto} from './mapper';

export type DocumentPermissionModel = PrismaClient.DocumentPermission;

@Injectable()
export class DocumentPermissionMapper extends MapperWithoutDto<DocumentPermission, DocumentPermissionModel> {
    toDomain(model: DocumentPermissionModel): DocumentPermission {
        return new DocumentPermission({
            id: DocumentPermissionId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            memberId: ClinicMemberId.from(model.memberId),
            entityType: toEnum(DocumentEntityType, model.entityType),
            entityId: model.entityId,
            canView: model.canView,
            grantedByMemberId:
                model.grantedByMemberId === null ? null : ClinicMemberId.from(model.grantedByMemberId),
            reason: model.reason,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }

    toPersistence(entity: DocumentPermission): DocumentPermissionModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            memberId: entity.memberId.toString(),
            entityType: toEnum(PrismaClient.DocumentEntityType, entity.entityType),
            entityId: entity.entityId,
            canView: entity.canView,
            grantedByMemberId: entity.grantedByMemberId?.toString() ?? null,
            reason: entity.reason,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
