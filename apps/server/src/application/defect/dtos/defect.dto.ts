import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Defect} from '../../../domain/defect/entities';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Defect'})
export class DefectDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The note of the defect',
        example: 'The door is broken',
    })
    note: string | null;

    @ApiProperty({
        description: 'The room ID of the defect',
        format: 'uuid',
    })
    roomId: string;

    @ApiProperty({
        description: 'The defect type ID of the defect',
        format: 'uuid',
    })
    defectTypeId: string;

    @ApiProperty({
        description: 'The creator ID of the defect',
        format: 'uuid',
    })
    createdById: string;

    @ApiProperty({
        description: 'The finisher ID of the defect',
        format: 'uuid',
    })
    finishedById: string | null;

    @ApiProperty({
        description: 'The finish date of the defect',
        type: 'string',
        format: 'date-time',
    })
    finishedAt: string | null;

    constructor(defect: Defect) {
        super(defect);
        this.companyId = defect.companyId.toString();
        this.note = defect.note;
        this.roomId = defect.roomId.toString();
        this.defectTypeId = defect.defectTypeId.toString();
        this.createdById = defect.createdById.toString();
        this.finishedById = defect.finishedById?.toString() ?? null;
        this.finishedAt = defect.finishedAt?.toISOString() ?? null;
    }
}
