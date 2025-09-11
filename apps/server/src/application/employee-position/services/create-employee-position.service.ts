import {Injectable} from '@nestjs/common';
import {DuplicateNameException, PreconditionException} from '../../../domain/@shared/exceptions';
import {EmployeePositionRepository} from '../../../domain/employee-position/employee-position.repository';
import {EmployeePosition} from '../../../domain/employee-position/entities';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateEmployeePositionDto, EmployeePositionDto} from '../dtos';

@Injectable()
export class CreateEmployeePositionService
    implements ApplicationService<CreateEmployeePositionDto, EmployeePositionDto>
{
    constructor(
        private readonly employeePositionRepository: EmployeePositionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateEmployeePositionDto>): Promise<EmployeePositionDto> {
        const employeePosition = EmployeePosition.create(payload);

        try {
            await this.employeePositionRepository.save(employeePosition);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot create an employee position with a name already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, employeePosition);

        return new EmployeePositionDto(employeePosition);
    }
}
