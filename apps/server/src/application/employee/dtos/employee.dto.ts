import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Employee} from '../../../domain/employee/entities';
import {PersonDto} from '../../person/dtos';

@ApiSchema({name: 'Employee'})
export class EmployeeDto extends PersonDto {
    @ApiProperty({
        description: 'The position ID of the employee',
        format: 'uuid',
    })
    positionId: string;

    @ApiProperty({
        description: 'Whether the employee has system access',
    })
    allowSystemAccess: boolean;

    constructor(employee: Employee) {
        super(employee);
        this.positionId = employee.positionId.toString();
        this.allowSystemAccess = employee.allowSystemAccess;
    }
}
