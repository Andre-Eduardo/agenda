import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {RecordAmendment} from '@domain/record/entities/record-amendment.entity';

@ApiSchema({name: 'RecordAmendment'})
export class RecordAmendmentDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({format: 'uuid'})
    recordId: string;

    @ApiProperty({format: 'uuid'})
    requestedByMemberId: string;

    @ApiProperty({type: String, nullable: true})
    requestedByName: string | null;

    @ApiProperty()
    justification: string;

    @ApiProperty({format: 'date-time'})
    reopenedAt: string;

    @ApiProperty({type: 'string', format: 'date-time', nullable: true})
    relockedAt: string | null;

    constructor(amendment: RecordAmendment, requestedByName: string | null) {
        super(amendment);
        this.clinicId = amendment.clinicId.toString();
        this.recordId = amendment.recordId.toString();
        this.requestedByMemberId = amendment.requestedByMemberId.toString();
        this.requestedByName = requestedByName;
        this.justification = amendment.justification;
        this.reopenedAt = amendment.reopenedAt.toISOString();
        this.relockedAt = amendment.relockedAt?.toISOString() ?? null;
    }
}
