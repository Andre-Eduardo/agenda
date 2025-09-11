import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import {ServiceCategoryChangedEvent, ServiceCategoryCreatedEvent, ServiceCategoryDeletedEvent} from '../events';

export type ServiceCategoryProps = EntityProps<ServiceCategory>;
export type CreateServiceCategory = CreateEntity<ServiceCategory>;
export type UpdateServiceCategory = Omit<Partial<ServiceCategoryProps>, 'companyId'>;

export class ServiceCategory extends AggregateRoot<ServiceCategoryId> {
    companyId: CompanyId;
    name: string;

    constructor(props: AllEntityProps<ServiceCategory>) {
        super(props);
        this.companyId = props.companyId;
        this.name = props.name;
        this.validate();
    }

    static create(props: CreateServiceCategory): ServiceCategory {
        const serviceCategoryId = ServiceCategoryId.generate();
        const now = new Date();

        const serviceCategory = new ServiceCategory({
            ...props,
            id: serviceCategoryId,
            createdAt: now,
            updatedAt: now,
        });

        serviceCategory.addEvent(
            new ServiceCategoryCreatedEvent({companyId: props.companyId, serviceCategory, timestamp: now})
        );

        return serviceCategory;
    }

    change(props: UpdateServiceCategory): void {
        const oldServiceCategory = new ServiceCategory(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        this.addEvent(
            new ServiceCategoryChangedEvent({
                companyId: this.companyId,
                oldState: oldServiceCategory,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new ServiceCategoryDeletedEvent({companyId: this.companyId, serviceCategory: this}));
    }

    toJSON(): EntityJson<ServiceCategory> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            name: this.name,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof ServiceCategoryProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Service category name must be at least 1 character long.');
            }
        }
    }
}

export class ServiceCategoryId extends EntityId<'ServiceCategoryId'> {
    static from(value: string): ServiceCategoryId {
        return new ServiceCategoryId(value);
    }

    static generate(): ServiceCategoryId {
        return new ServiceCategoryId();
    }
}
