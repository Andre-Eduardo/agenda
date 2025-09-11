import {ApiProperty} from '@nestjs/swagger';
import {InspectionEndReasonType, Inspection} from '../../../domain/inspection/entities';
import {RoomStatusDto} from '../../room-status/dtos';

export class InspectionDto extends RoomStatusDto {
    @ApiProperty({
        description: 'The end reason of the inspection',
        enum: InspectionEndReasonType,
        enumName: 'InspectionEndReasonType',
    })
    endReason: InspectionEndReasonType | null;

    @ApiProperty({
        description: 'The note of the inspection',
        example: 'Well cleaned!',
    })
    note: string | null;

    constructor(inspection: Inspection) {
        super(inspection);
        this.endReason = inspection.endReason;
        this.note = inspection.note;
    }
}
