import {Injectable} from '@nestjs/common';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../domain/@shared/exceptions';
import {EmployeePositionRepository} from '../../../domain/employee-position/employee-position.repository';
import {EventDispatcher} from '../../../domain/event';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {UpdateEmployeePositionDto} from '../dtos';
import {EmployeePositionDto} from '../dtos';

@Injectable()
export class UpdateEmployeePositionService
    implements ApplicationService<UpdateEmployeePositionDto, EmployeePositionDto>
{
    constructor(
        private readonly employeePositionRepository: EmployeePositionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateEmployeePositionDto>): Promise<EmployeePositionDto> {
        const employeePosition = await this.employeePositionRepository.findById(payload.id);

        if (employeePosition === null) {
            throw new ResourceNotFoundException('Employee position not found', payload.id.toString());
        }

        employeePosition.change(payload);

        try {
            await this.employeePositionRepository.save(employeePosition);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot update an employee position with a name already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, employeePosition);

        return new EmployeePositionDto(employeePosition);
    }
}
