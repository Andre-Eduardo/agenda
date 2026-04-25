import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {createZodDto} from '../../@shared/validation/dto';
import {z} from 'zod';
import {
    DocumentEntityType,
    DocumentPermission,
} from '../../../domain/document-permission/entities';
import {EntityDto} from '../../@shared/dto';

export const grantDocumentPermissionSchema = z.object({
    clinicId: z.string().uuid(),
    memberId: z.string().uuid(),
    entityType: z.nativeEnum(DocumentEntityType),
    entityId: z.string().uuid(),
    canView: z.boolean(),
    reason: z.string().nullish(),
});

export class GrantDocumentPermissionDto extends createZodDto(grantDocumentPermissionSchema) {}

@ApiSchema({name: 'DocumentPermission'})
export class DocumentPermissionDto extends EntityDto {
    @ApiProperty({format: 'uuid'}) clinicId: string;
    @ApiProperty({format: 'uuid'}) memberId: string;
    @ApiProperty({enum: DocumentEntityType}) entityType: DocumentEntityType;
    @ApiProperty({format: 'uuid'}) entityId: string;
    @ApiProperty() canView: boolean;
    @ApiProperty({format: 'uuid', nullable: true}) grantedByMemberId: string | null;
    @ApiProperty({nullable: true}) reason: string | null;

    constructor(permission: DocumentPermission) {
        super(permission);
        this.clinicId = permission.clinicId.toString();
        this.memberId = permission.memberId.toString();
        this.entityType = permission.entityType;
        this.entityId = permission.entityId;
        this.canView = permission.canView;
        this.grantedByMemberId = permission.grantedByMemberId?.toString() ?? null;
        this.reason = permission.reason;
    }
}
