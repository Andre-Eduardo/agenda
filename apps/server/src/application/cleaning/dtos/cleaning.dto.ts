import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Cleaning, CleaningEndReasonType} from '../../../domain/cleaning/entities';
import {RoomStatusDto} from '../../room-status/dtos';

@ApiSchema({name: 'Cleaning'})
export class CleaningDto extends RoomStatusDto {
    @ApiProperty({
        description: 'The end reason of the cleaning',
        enum: CleaningEndReasonType,
        enumName: 'CleaningEndReasonType',
    })
    endReason: CleaningEndReasonType | null;

    constructor(cleaning: Cleaning) {
        super(cleaning);

        this.endReason = cleaning.endReason;
    }
}
