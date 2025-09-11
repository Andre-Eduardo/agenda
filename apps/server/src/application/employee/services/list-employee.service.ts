import {Injectable} from '@nestjs/common';
import {EmployeeRepository} from '../../../domain/employee/employee.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {EmployeeDto, ListEmployeeDto} from '../dtos';

@Injectable()
export class ListEmployeeService implements ApplicationService<ListEmployeeDto, PaginatedDto<EmployeeDto>> {
    constructor(private readonly employeeRepository: EmployeeRepository) {}

    async execute({payload}: Command<ListEmployeeDto>): Promise<PaginatedDto<EmployeeDto>> {
        const result = await this.employeeRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                documentId: payload.documentId,
                phone: payload.phone,
                positionId: payload.positionId,
                companyName: payload.companyName,
                personType: payload.personType,
                profiles: payload.profiles,
                gender: payload.gender,
            }
        );

        return {
            ...result,
            data: result.data.map((employee) => new EmployeeDto(employee)),
        };
    }
}
