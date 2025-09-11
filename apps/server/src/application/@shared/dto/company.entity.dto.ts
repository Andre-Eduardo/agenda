import {ApiProperty} from '@nestjs/swagger';
import {CompanyId} from '../../../domain/company/entities';
import {EntityDto, EntityDtoProps} from './entity.dto';

export abstract class CompanyEntityDto extends EntityDto {
    @ApiProperty({
        description: 'The unique identifier of the company',
        format: 'uuid',
    })
    companyId: string;

    protected constructor(entity: EntityDtoProps & {companyId: CompanyId}) {
        super(entity);
        this.companyId = entity.companyId.toString();
    }
}
