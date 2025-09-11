import {type AllEntityProps, type CreateEntity, type EntityJson, type EntityProps} from '../../@shared/entity';
import {InvalidInputException} from '../../@shared/exceptions';
import type {EmployeePositionId} from '../../employee-position/entities';
import {Person, PersonId, PersonProfile} from '../../person/entities';
import type {UserId} from '../../user/entities';
import {EmployeeChangedEvent, EmployeeCreatedEvent, EmployeeDeletedEvent} from '../events';

export type EmployeeProps = EntityProps<Employee>;
export type CreateEmployee = Omit<CreateEntity<Employee>, 'profiles'>;
export type CreateEmployeeFromPerson = Omit<CreateEmployee, keyof Person>;
export type UpdateEmployee = Partial<Employee>;

export class Employee extends Person {
    positionId: EmployeePositionId;
    allowSystemAccess: boolean;
    userId: UserId | null;

    constructor(props: AllEntityProps<Employee>) {
        super(props);
        this.positionId = props.positionId;
        this.allowSystemAccess = props.allowSystemAccess;
        this.userId = props.userId;
        this.validate();
    }

    static create(props: CreateEmployee): Employee {
        const now = new Date();
        const employee = new Employee({
            ...props,
            id: PersonId.generate(),
            companyName: props.companyName ?? null,
            phone: props.phone ?? null,
            gender: props.gender ?? null,
            profiles: new Set([PersonProfile.EMPLOYEE]),
            userId: props.userId ?? null,
            createdAt: now,
            updatedAt: now,
        });

        employee.addEvent(new EmployeeCreatedEvent({companyId: props.companyId, employee, timestamp: now}));

        return employee;
    }

    static createFromPerson(person: Person, props: CreateEmployeeFromPerson): Employee {
        const now = new Date();
        const employee = new Employee({
            ...person,
            ...props,
            profiles: new Set([...person.profiles, PersonProfile.EMPLOYEE]),
            userId: props.userId ?? null,
            createdAt: now,
            updatedAt: now,
        });

        employee.addEvent(new EmployeeCreatedEvent({companyId: person.companyId, employee, timestamp: now}));

        return employee;
    }

    change(props: UpdateEmployee): void {
        const oldEmployee = new Employee(this);

        super.change(props);

        if (props.positionId !== undefined) {
            this.positionId = props.positionId;
        }

        if (props.userId !== undefined) {
            this.userId = props.userId;
        }

        if (props.allowSystemAccess !== undefined) {
            this.allowSystemAccess = props.allowSystemAccess;
            this.validate('allowSystemAccess');
        }

        this.addEvent(new EmployeeChangedEvent({companyId: this.companyId, oldState: oldEmployee, newState: this}));
    }

    delete(): void {
        this.profiles.delete(PersonProfile.EMPLOYEE);
        this.addEvent(new EmployeeDeletedEvent({companyId: this.companyId, employee: this}));
    }

    toJSON(): EntityJson<Employee> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            gender: this.gender ?? null,
            documentId: this.documentId.toJSON(),
            phone: this.phone?.toJSON() ?? null,
            name: this.name,
            companyName: this.companyName ?? null,
            profiles: Array.from(this.profiles),
            personType: this.personType,
            positionId: this.positionId.toJSON(),
            allowSystemAccess: this.allowSystemAccess,
            userId: this.userId?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    protected validate(...fields: Array<keyof EmployeeProps>) {
        const personFields = fields.filter(
            (field) => field !== 'positionId' && field !== 'allowSystemAccess' && field !== 'userId'
        );

        super.validate(...personFields);

        if (fields.length === 0 || fields.includes('allowSystemAccess')) {
            if (this.allowSystemAccess && this.userId == null) {
                throw new InvalidInputException('The user ID is required to allow system access.');
            }
        }
    }
}
