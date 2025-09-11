import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {DefectType} from '../../../domain/defect-type/entities';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'DefectType'})
export class DefectTypeDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The name of the defect type',
        example: 'Air conditioner',
    })
    name: string;

    constructor(defectType: DefectType) {
        super(defectType);
        this.companyId = defectType.companyId.toString();
        this.name = defectType.name;
    }
}
