import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Audit, AuditEndReasonType} from '../../../domain/audit/entities';
import {RoomStatusDto} from '../../room-status/dtos';

@ApiSchema({name: 'Audit'})
export class AuditDto extends RoomStatusDto {
    @ApiProperty({
        description: 'The reason of the audit',
        example: 'Air conditioning not working.',
    })
    reason: string;

    @ApiProperty({
        description: 'The end reason of the audit',
        enum: AuditEndReasonType,
        enumName: 'AuditEndReasonType',
    })
    endReason: AuditEndReasonType | null;

    @ApiProperty({
        description: 'Any note about the audit',
    })
    note: string | null;

    constructor(audit: Audit) {
        super(audit);
        this.reason = audit.reason;
        this.endReason = audit.endReason;
        this.note = audit.note;
    }
}
