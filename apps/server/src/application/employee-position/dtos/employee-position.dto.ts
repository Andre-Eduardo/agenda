import {ApiProperty} from '@nestjs/swagger';
import {Permission} from '../../../domain/auth';
import type {EmployeePosition} from '../../../domain/employee-position/entities';
import {CompanyEntityDto} from '../../@shared/dto';

export class EmployeePositionDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The name of the employee position',
        example: 'Manager',
    })
    name: string;

    @ApiProperty({
        description: 'The permissions granted to the employee position',
        enum: [...Permission.all()],
        enumName: 'Permission',
    })
    permissions: string[];

    constructor(employeePosition: EmployeePosition) {
        super(employeePosition);
        this.name = employeePosition.name;
        this.permissions = [...employeePosition.permissions];
    }
}
