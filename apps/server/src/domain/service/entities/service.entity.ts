import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import type {ProductProps} from '../../product/entities';
import type {ServiceCategoryId} from '../../service-category/entities';
import {ServiceChangedEvent, ServiceCreatedEvent, ServiceDeletedEvent} from '../events';

export type ServiceProps = EntityProps<Service>;
export type CreateService = CreateEntity<Service>;
export type UpdateService = Partial<ServiceProps>;

export class Service extends AggregateRoot<ServiceId> {
    companyId: CompanyId;
    categoryId: ServiceCategoryId;
    name: string;
    code: number;
    price: number;

    constructor(props: AllEntityProps<Service>) {
        super(props);
        this.companyId = props.companyId;
        this.categoryId = props.categoryId;
        this.name = props.name;
        this.code = props.code;
        this.price = props.price;
        this.validate();
    }

    static create(props: CreateService): Service {
        const serviceId = ServiceId.generate();
        const now = new Date();

        const service = new Service({
            ...props,
            id: serviceId,
            createdAt: now,
            updatedAt: now,
        });

        service.addEvent(
            new ServiceCreatedEvent({
                companyId: props.companyId,
                service,
                timestamp: now,
            })
        );

        return service;
    }

    change(props: UpdateService): void {
        const oldService = new Service(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        if (props.code !== undefined) {
            this.code = props.code;
            this.validate('code');
        }

        if (props.price !== undefined) {
            this.price = props.price;
            this.validate('price');
        }

        if (props.categoryId !== undefined) {
            this.categoryId = props.categoryId;
        }

        this.addEvent(
            new ServiceChangedEvent({
                companyId: this.companyId,
                oldState: oldService,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new ServiceDeletedEvent({companyId: this.companyId, service: this}));
    }

    toJSON(): EntityJson<Service> {
        return {
            id: this.id.toString(),
            companyId: this.companyId.toJSON(),
            name: this.name,
            code: this.code,
            price: this.price,
            categoryId: this.categoryId.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof ProductProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Service name must be at least 1 character long.');
            }
        }

        if (fields.length === 0 || fields.includes('code')) {
            if (this.code < 1) {
                throw new InvalidInputException('Service code must be greater than 0.');
            }
        }

        if (fields.length === 0 || fields.includes('price')) {
            if (this.price < 0) {
                throw new InvalidInputException('Service price must be positive.');
            }
        }
    }
}

export class ServiceId extends EntityId<'ServiceId'> {
    static from(value: string): ServiceId {
        return new ServiceId(value);
    }

    static generate(): ServiceId {
        return new ServiceId();
    }
}
