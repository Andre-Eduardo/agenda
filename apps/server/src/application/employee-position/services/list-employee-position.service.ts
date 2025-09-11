import {Injectable} from '@nestjs/common';
import {EmployeePositionRepository} from '../../../domain/employee-position/employee-position.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import type {PaginatedDto} from '../../@shared/dto';
import type {ListEmployeePositionDto} from '../dtos';
import {EmployeePositionDto} from '../dtos';

@Injectable()
export class ListEmployeePositionService
    implements ApplicationService<ListEmployeePositionDto, PaginatedDto<EmployeePositionDto>>
{
    constructor(private readonly employeePositionRepository: EmployeePositionRepository) {}

    async execute({payload}: Command<ListEmployeePositionDto>): Promise<PaginatedDto<EmployeePositionDto>> {
        const result = await this.employeePositionRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
            }
        );

        return {
            ...result,
            data: result.data.map((employeePosition) => new EmployeePositionDto(employeePosition)),
        };
    }
}
