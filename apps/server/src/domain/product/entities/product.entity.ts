import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import type {ProductCategoryId} from '../../product-category/entities';
import {ProductChangedEvent, ProductCreatedEvent, ProductDeletedEvent} from '../events';

export type ProductProps = EntityProps<Product>;
export type CreateProduct = CreateEntity<Product>;
export type UpdateProduct = Omit<Partial<ProductProps>, 'companyId'>;

export class Product extends AggregateRoot<ProductId> {
    companyId: CompanyId;
    categoryId: ProductCategoryId;
    name: string;
    code: number;
    price: number;

    constructor(props: AllEntityProps<Product>) {
        super(props);
        this.companyId = props.companyId;
        this.categoryId = props.categoryId;
        this.name = props.name;
        this.code = props.code;
        this.price = props.price;
        this.validate();
    }

    static create(props: CreateProduct): Product {
        const productId = ProductId.generate();
        const now = new Date();

        const product = new Product({
            ...props,
            id: productId,
            createdAt: now,
            updatedAt: now,
        });

        product.addEvent(
            new ProductCreatedEvent({
                companyId: props.companyId,
                product,
                timestamp: now,
            })
        );

        return product;
    }

    change(props: UpdateProduct): void {
        const oldProduct = new Product(this);

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
            this.validate();
        }

        this.addEvent(
            new ProductChangedEvent({
                companyId: this.companyId,
                oldState: oldProduct,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new ProductDeletedEvent({companyId: this.companyId, product: this}));
    }

    toJSON(): EntityJson<Product> {
        return {
            id: this.id.toString(),
            companyId: this.companyId.toJSON(),
            categoryId: this.categoryId.toJSON(),
            name: this.name,
            code: this.code,
            price: this.price,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof ProductProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Product name must be at least 1 character long.');
            }
        }

        if (fields.length === 0 || fields.includes('code')) {
            if (this.code < 1) {
                throw new InvalidInputException('Product code must be greater than 0.');
            }
        }

        if (fields.length === 0 || fields.includes('price')) {
            if (this.price < 0) {
                throw new InvalidInputException('Product price cannot be negative.');
            }
        }
    }
}

export class ProductId extends EntityId<'ProductId'> {
    static from(value: string): ProductId {
        return new ProductId(value);
    }

    static generate(): ProductId {
        return new ProductId();
    }
}
