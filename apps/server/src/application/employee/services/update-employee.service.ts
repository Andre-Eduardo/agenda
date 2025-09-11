import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EmployeeRepository} from '../../../domain/employee/employee.repository';
import {Employee} from '../../../domain/employee/entities';
import {EmployeePositionRepository} from '../../../domain/employee-position/employee-position.repository';
import {EventDispatcher} from '../../../domain/event';
import {DuplicateDocumentIdException} from '../../../domain/person/person.exceptions';
import {User} from '../../../domain/user/entities';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {EmployeeDto, UpdateEmployeeDto} from '../dtos';

@Injectable()
export class UpdateEmployeeService implements ApplicationService<UpdateEmployeeDto, EmployeeDto> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly employeeRepository: EmployeeRepository,
        private readonly employeePositionRepository: EmployeePositionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateEmployeeDto>): Promise<EmployeeDto> {
        const employee = await this.employeeRepository.findById(payload.id);

        if (employee === null) {
            throw new ResourceNotFoundException('Employee not found', payload.id.toString());
        }

        if (payload.positionId) {
            const position = await this.employeePositionRepository.findById(payload.positionId);

            if (!position?.companyId.equals(employee.companyId)) {
                throw new ResourceNotFoundException('Employee position not found', payload.positionId.toString());
            }
        }

        const user = await this.processUser(employee, payload);

        employee.change({
            ...payload,
            userId: payload.allowSystemAccess === false ? null : user?.id,
        });

        try {
            if (user) await this.userRepository.save(user);
            await this.employeeRepository.save(employee);
        } catch (e) {
            if (e instanceof DuplicateDocumentIdException) {
                throw new PreconditionException('Cannot update an employee with a document ID already in use.');
            }

            throw e;
        }

        if (user) this.eventDispatcher.dispatch(actor, user);
        this.eventDispatcher.dispatch(actor, employee);

        return new EmployeeDto(employee);
    }

    /**
     * Creates or updates the user associated with the employee.
     *
     * - If the employee already has a user, it will update the user data.
     * - If the employee does not have a user, it will create a new one with the provided username and password.
     * - If the employee should not have system access, it will remove the user from the company if necessary.
     *
     * **This method should not be used to change the password of an existing user.**
     *
     * @param employee The employee to process.
     * @param payload The payload with the user data.
     * @returns The user if the user was created, updated or removed from the company.
     * @returns Null if the employee should not have system access.
     * @returns Undefined if no changes were made to the employee access.
     */
    private async processUser(employee: Employee, payload: UpdateEmployeeDto): Promise<User | null | undefined> {
        if (payload.allowSystemAccess === undefined) {
            return undefined;
        }

        const existingUser = await this.userRepository.findByEmployeeId(employee.id);

        if (!payload.allowSystemAccess) {
            if (existingUser !== null) {
                existingUser.removeFromCompany(employee.companyId);
            }

            return existingUser;
        }

        if (existingUser === null) {
            if (!payload.username || !payload.password) {
                throw new PreconditionException('The username and password are required to allow system access.');
            }

            const [firstName, lastName] = this.getSplitName(payload.name ?? employee.name);

            return User.create({
                companies: [employee.companyId],
                username: payload.username,
                password: payload.password,
                firstName,
                lastName,
            });
        }

        if (payload.username != null && !payload.username?.equals(existingUser.username)) {
            const user = await this.userRepository.findByUsername(payload.username);

            if (user !== null && !user.id.equals(existingUser.id)) {
                throw new PreconditionException('Cannot update the user with a username already in use.');
            }

            existingUser.change({
                username: payload.username,
            });
        }

        existingUser.addToCompany(employee.companyId);

        return existingUser;
    }

    private getSplitName(name: string): [string, string | null] {
        const [firstName, ...lastName] = name.split(' ');

        return [firstName, lastName.join(' ') || null];
    }
}
