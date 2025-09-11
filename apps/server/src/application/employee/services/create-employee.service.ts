import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CompanyId} from '../../../domain/company/entities';
import {EmployeeRepository} from '../../../domain/employee/employee.repository';
import {Employee} from '../../../domain/employee/entities';
import {EmployeePositionRepository} from '../../../domain/employee-position/employee-position.repository';
import {EmployeePositionId} from '../../../domain/employee-position/entities';
import {EventDispatcher} from '../../../domain/event';
import {Person, PersonId, PersonProfile} from '../../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../../domain/person/person.exceptions';
import {PersonRepository} from '../../../domain/person/person.repository';
import {User} from '../../../domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '../../../domain/user/user.exceptions';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateEmployeeDto, EmployeeDto} from '../dtos';

@Injectable()
export class CreateEmployeeService implements ApplicationService<CreateEmployeeDto, EmployeeDto> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly personRepository: PersonRepository,
        private readonly employeeRepository: EmployeeRepository,
        private readonly employeePositionRepository: EmployeePositionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateEmployeeDto>): Promise<EmployeeDto> {
        const person = 'id' in payload ? await this.getPerson(payload.id) : null;
        const user = payload.allowSystemAccess ? await this.createUser(person, payload) : null;

        const employee =
            'id' in payload
                ? Employee.createFromPerson(person!, {...payload, userId: user?.id})
                : Employee.create({...payload, userId: user?.id});

        await this.validatePosition(payload.positionId, employee.companyId);

        if (user) await this.saveUser(user);
        await this.saveEmployee(employee);

        if (user) this.eventDispatcher.dispatch(actor, user);
        this.eventDispatcher.dispatch(actor, employee);

        return new EmployeeDto(employee);
    }

    private async getPerson(personId: PersonId): Promise<Person> {
        const person = await this.personRepository.findById(personId);

        if (person === null) {
            throw new ResourceNotFoundException('Person not found', personId.toString());
        }

        if (person.profiles.has(PersonProfile.EMPLOYEE)) {
            throw new PreconditionException('The person is already an employee.');
        }

        return person;
    }

    private async createUser(person: Person | null, payload: CreateEmployeeDto): Promise<User> {
        if (!payload.username || !payload.password) {
            throw new PreconditionException('The username and password are required to allow system access.');
        }

        const [firstName, lastName] = this.getSplitName('id' in payload ? person!.name : payload.name);

        return User.create({
            companies: 'id' in payload ? [person!.companyId] : [payload.companyId],
            username: payload.username,
            password: payload.password,
            firstName,
            lastName,
        });
    }

    private getSplitName(name: string): [string, string | null] {
        const [firstName, ...lastName] = name.split(' ');

        return [firstName, lastName.join(' ') || null];
    }

    private async validatePosition(positionId: EmployeePositionId, companyId: CompanyId): Promise<void> {
        const position = await this.employeePositionRepository.findById(positionId);

        if (!position?.companyId.equals(companyId)) {
            throw new ResourceNotFoundException('Employee position not found', positionId.toString());
        }
    }

    private async saveUser(user: User): Promise<void> {
        try {
            await this.userRepository.save(user);
        } catch (e) {
            if (e instanceof DuplicateUsernameException) {
                throw new PreconditionException('Cannot create a user with a username already in use.');
            }

            if (e instanceof DuplicateEmailException) {
                throw new PreconditionException('Cannot create a user with an email already in use.');
            }

            throw e;
        }
    }

    private async saveEmployee(employee: Employee): Promise<void> {
        try {
            await this.employeeRepository.save(employee);
        } catch (e) {
            if (e instanceof DuplicateDocumentIdException) {
                throw new PreconditionException('Cannot create an employee with a document ID already in use.');
            }

            throw e;
        }
    }
}
