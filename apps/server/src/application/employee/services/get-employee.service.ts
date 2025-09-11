import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EmployeeRepository} from '../../../domain/employee/employee.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetEmployeeDto, EmployeeDto} from '../dtos';

@Injectable()
export class GetEmployeeService implements ApplicationService<GetEmployeeDto, EmployeeDto> {
    constructor(private readonly employeeRepository: EmployeeRepository) {}

    async execute({payload}: Command<GetEmployeeDto>): Promise<EmployeeDto> {
        const employee = await this.employeeRepository.findById(payload.id);

        if (!employee) {
            throw new ResourceNotFoundException('Employee not found', payload.id.toString());
        }

        return new EmployeeDto(employee);
    }
}
