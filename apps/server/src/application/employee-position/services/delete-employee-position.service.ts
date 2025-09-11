import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EmployeePositionRepository} from '../../../domain/employee-position/employee-position.repository';
import {EventDispatcher} from '../../../domain/event';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {DeleteEmployeePositionDto} from '../dtos';

@Injectable()
export class DeleteEmployeePositionService implements ApplicationService<DeleteEmployeePositionDto> {
    constructor(
        private readonly employeePositionRepository: EmployeePositionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteEmployeePositionDto>): Promise<void> {
        const employeePosition = await this.employeePositionRepository.findById(payload.id);

        if (employeePosition === null) {
            throw new ResourceNotFoundException('Employee position not found', payload.id.toString());
        }

        employeePosition.delete();

        await this.employeePositionRepository.delete(employeePosition.id);

        this.eventDispatcher.dispatch(actor, employeePosition);
    }
}
