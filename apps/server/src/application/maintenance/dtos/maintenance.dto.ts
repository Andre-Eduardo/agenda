import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {AllEntityProps} from '../../../domain/@shared/entity';
import {Defect} from '../../../domain/defect/entities';
import {Maintenance} from '../../../domain/maintenance/entities';
import {DefectDto} from '../../defect/dtos';
import {RoomStatusDto} from '../../room-status/dtos';

@ApiSchema({name: 'Maintenance'})
export class MaintenanceDto extends RoomStatusDto {
    @ApiProperty({
        description: 'The note of the maintenance',
        example: 'Replace the tv',
    })
    note: string;

    @ApiProperty({
        description: 'The list of defects',
    })
    defects: DefectDto[];

    constructor(params: Override<AllEntityProps<Maintenance>, {defects: Defect[]}>) {
        super(params);
        this.note = params.note;
        this.defects = params.defects.map((defect) => new DefectDto(defect));
    }
}
