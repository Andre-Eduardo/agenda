import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import {ProductCategoryCreatedEvent, ProductCategoryDeletedEvent, ProductCategoryChangedEvent} from '../events';

export type ProductCategoryProps = EntityProps<ProductCategory>;
export type CreateProductCategory = CreateEntity<ProductCategory>;
export type UpdateProductCategory = Partial<ProductCategoryProps>;

export class ProductCategory extends AggregateRoot<ProductCategoryId> {
    companyId: CompanyId;
    name: string;

    constructor(props: AllEntityProps<ProductCategory>) {
        super(props);
        this.companyId = props.companyId;
        this.name = props.name;
        this.validate();
    }

    static create(props: CreateProductCategory): ProductCategory {
        const productCategoryId = ProductCategoryId.generate();
        const now = new Date();

        const productCategory = new ProductCategory({
            ...props,
            id: productCategoryId,
            createdAt: now,
            updatedAt: now,
        });

        productCategory.addEvent(
            new ProductCategoryCreatedEvent({companyId: props.companyId, productCategory, timestamp: now})
        );

        return productCategory;
    }

    change(props: UpdateProductCategory): void {
        const oldProductCategory = new ProductCategory(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        this.addEvent(
            new ProductCategoryChangedEvent({
                companyId: this.companyId,
                oldState: oldProductCategory,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new ProductCategoryDeletedEvent({companyId: this.companyId, productCategory: this}));
    }

    toJSON(): EntityJson<ProductCategory> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            name: this.name,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof ProductCategoryProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Product category name must be at least 1 character long.');
            }
        }
    }
}

export class ProductCategoryId extends EntityId<'ProductCategoryId'> {
    static from(value: string): ProductCategoryId {
        return new ProductCategoryId(value);
    }

    static generate(): ProductCategoryId {
        return new ProductCategoryId();
    }
}
