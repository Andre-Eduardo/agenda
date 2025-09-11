import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {Entity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {ProductId} from '../../product/entities';
import type {UserId} from '../../user/entities';
import type {SaleId} from './sale.entity';

export type SaleItemProps = EntityProps<SaleItem>;
export type CreateSaleItem = Omit<CreateEntity<SaleItem>, 'canceledAt' | 'canceledBy' | 'canceledReason'>;
export type UpdateSaleItem = Partial<SaleItemProps>;

export class SaleItem extends Entity<SaleItemId> {
    saleId: SaleId;
    productId: ProductId;
    price: number;
    quantity: number;
    note: string | null;
    canceledAt: Date | null;
    canceledBy: UserId | null;
    canceledReason: string | null;

    constructor(props: AllEntityProps<SaleItem>) {
        super(props);
        this.saleId = props.saleId;
        this.productId = props.productId;
        this.price = props.price;
        this.quantity = props.quantity;
        this.note = props.note;
        this.canceledAt = props.canceledAt;
        this.canceledBy = props.canceledBy;
        this.canceledReason = props.canceledReason;
        this.validate();
    }

    static create(props: CreateSaleItem): SaleItem {
        const now = new Date();

        return new SaleItem({
            ...props,
            id: SaleItemId.generate(),
            note: props.note ?? null,
            canceledAt: null,
            canceledBy: null,
            canceledReason: null,
            createdAt: now,
            updatedAt: now,
        });
    }

    change(props: UpdateSaleItem): void {
        if (props.quantity !== undefined) {
            this.quantity = props.quantity;
            this.validate('quantity');
        }

        if (props.note !== undefined) {
            this.note = props.note;
        }

        this.update();
    }

    toJSON(): EntityJson<SaleItem> {
        return {
            id: this.id.toJSON(),
            saleId: this.saleId.toJSON(),
            productId: this.productId.toJSON(),
            price: this.price,
            quantity: this.quantity,
            note: this.note,
            canceledAt: this.canceledAt?.toJSON() ?? null,
            canceledBy: this.canceledBy?.toJSON() ?? null,
            canceledReason: this.canceledReason,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof SaleItemProps>): void {
        if (fields.length === 0 || fields.includes('quantity')) {
            if (this.quantity < 1) {
                throw new InvalidInputException('Sale item quantity must be at least 1.');
            }
        }

        if (fields.length === 0 || fields.includes('price')) {
            if (this.price < 0) {
                throw new InvalidInputException('Sale item price cannot be negative.');
            }
        }
    }
}

export class SaleItemId extends EntityId<'SaleItemId'> {
    static from(value: string): SaleItemId {
        return new SaleItemId(value);
    }

    static generate(): SaleItemId {
        return new SaleItemId();
    }
}
