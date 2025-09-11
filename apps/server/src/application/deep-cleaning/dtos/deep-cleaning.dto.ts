import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {DeepCleaning, DeepCleaningEndReasonType} from '../../../domain/deep-cleaning/entities';
import {RoomStatusDto} from '../../room-status/dtos';

@ApiSchema({name: 'DeepCleaning'})
export class DeepCleaningDto extends RoomStatusDto {
    @ApiProperty({
        description: 'The end reason of the deep cleaning',
        enum: DeepCleaningEndReasonType,
        enumName: 'DeepCleaningEndReasonType',
    })
    endReason: DeepCleaningEndReasonType | null;

    constructor(deepCleaning: DeepCleaning) {
        super(deepCleaning);
        this.endReason = deepCleaning.endReason;
    }
}
