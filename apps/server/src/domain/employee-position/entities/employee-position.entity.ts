import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {Permission} from '../../auth';
import type {CompanyId} from '../../company/entities';
import {EmployeePositionChangedEvent, EmployeePositionCreatedEvent, EmployeePositionDeletedEvent} from '../events';

export type EmployeePositionProps = EntityProps<EmployeePosition>;
export type CreateEmployeePosition = CreateEntity<EmployeePosition>;
export type UpdateEmployeePosition = Omit<Partial<EmployeePositionProps>, 'companyId'>;

export class EmployeePosition extends AggregateRoot<EmployeePositionId> {
    companyId: CompanyId;
    name: string;
    permissions: Set<Permission>;

    constructor(props: AllEntityProps<EmployeePosition>) {
        super(props);
        this.companyId = props.companyId;
        this.name = props.name;
        this.permissions = props.permissions;
        this.validate();
    }

    static create(props: CreateEmployeePosition): EmployeePosition {
        const now = new Date();
        const employeePositionId = EmployeePositionId.generate();

        const employeePosition = new EmployeePosition({
            ...props,
            id: employeePositionId,
            createdAt: now,
            updatedAt: now,
        });

        employeePosition.addEvent(
            new EmployeePositionCreatedEvent({companyId: props.companyId, employeePosition, timestamp: now})
        );

        return employeePosition;
    }

    change(props: UpdateEmployeePosition): void {
        const oldEmployeePosition = new EmployeePosition(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        if (props.permissions !== undefined) {
            this.permissions = props.permissions;
        }

        this.addEvent(
            new EmployeePositionChangedEvent({
                companyId: this.companyId,
                oldState: oldEmployeePosition,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new EmployeePositionDeletedEvent({companyId: this.companyId, employeePosition: this}));
    }

    toJSON(): EntityJson<EmployeePosition> {
        return {
            id: this.id.toString(),
            companyId: this.companyId.toJSON(),
            name: this.name,
            permissions: Array.from(this.permissions),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    validate(...fields: Array<keyof EmployeePositionProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Employee position name must be at least 1 character long.');
            }
        }
    }
}

export class EmployeePositionId extends EntityId<'EmployeePositionId'> {
    static from(value: string): EmployeePositionId {
        return new EmployeePositionId(value);
    }

    static generate(): EmployeePositionId {
        return new EmployeePositionId();
    }
}
