import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EmployeeRepository} from '../../../domain/employee/employee.repository';
import {EventDispatcher} from '../../../domain/event';
import {PersonRepository} from '../../../domain/person/person.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteEmployeeDto} from '../dtos';

@Injectable()
export class DeleteEmployeeService implements ApplicationService<DeleteEmployeeDto> {
    constructor(
        private readonly personRepository: PersonRepository,
        private readonly employeeRepository: EmployeeRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteEmployeeDto>): Promise<void> {
        const employee = await this.employeeRepository.findById(payload.id);

        if (!employee) {
            throw new ResourceNotFoundException('Employee not found', payload.id.toString());
        }

        employee.delete();

        // Required to update the person's profiles.
        await this.employeeRepository.save(employee);

        await this.employeeRepository.delete(payload.id);

        if (employee.profiles.size === 0) {
            await this.personRepository.delete(payload.id);
        }

        this.eventDispatcher.dispatch(actor, employee);
    }
}
