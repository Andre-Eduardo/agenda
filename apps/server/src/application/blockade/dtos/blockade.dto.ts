import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {AllEntityProps} from '../../../domain/@shared/entity';
import {Blockade} from '../../../domain/blockade/entities';
import {Defect} from '../../../domain/defect/entities';
import {DefectDto} from '../../defect/dtos';
import {RoomStatusDto} from '../../room-status/dtos';

@ApiSchema({name: 'Blockade'})
export class BlockadeDto extends RoomStatusDto {
    @ApiProperty({
        description: 'The note of the Blockade',
        example: 'Replace the tv',
    })
    note: string;

    @ApiProperty({
        description: 'The list of defects',
    })
    defects: DefectDto[];

    constructor(blockade: Override<AllEntityProps<Blockade>, {defects: Defect[]}>) {
        super(blockade);
        this.note = blockade.note;
        this.defects = blockade.defects.map((defect) => new DefectDto(defect));
    }
}
