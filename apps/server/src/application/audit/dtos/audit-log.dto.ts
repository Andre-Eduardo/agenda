import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {AuditLogEntry} from '@domain/audit/audit-log.repository';

@ApiSchema({name: 'AuditLog'})
export class AuditLogDto {
    @ApiProperty() id!: string;
    @ApiProperty() clinicId!: string;
    @ApiProperty() actorUserId!: string;
    @ApiProperty() actorMemberId!: string;
    @ApiProperty() resource!: string;
    @ApiProperty({type: String, nullable: true}) resourceId!: string | null;
    @ApiProperty() action!: string;
    @ApiProperty({enum: ['SUCCESS', 'DENIED', 'ERROR']}) result!: string;
    @ApiProperty() statusCode!: number;
    @ApiProperty() ip!: string;
    @ApiProperty({format: 'date-time'}) occurredAt!: string;

    constructor(entry: AuditLogEntry) {
        Object.assign(this, {...entry, occurredAt: entry.occurredAt.toISOString()});
    }
}

@ApiSchema({name: 'PaginatedAuditLog'})
export class PaginatedAuditLogDto {
    @ApiProperty({type: () => [AuditLogDto]}) data!: AuditLogDto[];
    @ApiProperty() totalCount!: number;
}
