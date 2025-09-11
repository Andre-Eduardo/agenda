import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EmployeePositionRepository} from '../../../domain/employee-position/employee-position.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {GetEmployeePositionDto} from '../dtos';
import {EmployeePositionDto} from '../dtos';

@Injectable()
export class GetEmployeePositionService implements ApplicationService<GetEmployeePositionDto, EmployeePositionDto> {
    constructor(private readonly employeePositionRepository: EmployeePositionRepository) {}

    async execute({payload}: Command<GetEmployeePositionDto>): Promise<EmployeePositionDto> {
        const employeePosition = await this.employeePositionRepository.findById(payload.id);

        if (employeePosition === null) {
            throw new ResourceNotFoundException('Employee position not found', payload.id.toString());
        }

        return new EmployeePositionDto(employeePosition);
    }
}
