import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {RoomCategory} from '../../../domain/room-category/entities';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'RoomCategory'})
export class RoomCategoryDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The name of the room category',
        example: 'Royal Garden',
    })
    name: string;

    @ApiProperty({
        description: 'The acronym of the room category',
        example: 'RG',
    })
    acronym: string;

    @ApiProperty({
        description: 'The default number of guests in the room category',
        example: 2,
    })
    guestCount: number;

    constructor(roomCategory: RoomCategory) {
        super(roomCategory);
        this.name = roomCategory.name;
        this.acronym = roomCategory.acronym;
        this.guestCount = roomCategory.guestCount;
    }
}
