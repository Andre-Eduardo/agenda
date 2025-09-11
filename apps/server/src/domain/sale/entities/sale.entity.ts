import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException, ResourceNotFoundException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import type {UserId} from '../../user/entities';
import type {CreateSaleItem, SaleItemId, UpdateSaleItem} from './sale-item.entity';
import {SaleItem} from './sale-item.entity';

export type SaleProps = EntityProps<Sale>;
export type CreateSale = Override<CreateEntity<Sale>, {items: Array<Omit<CreateSaleItem, 'saleId'>>}>;
export type UpdateSale = Override<
    Partial<SaleProps>,
    {items?: Array<(UpdateSaleItem & {id: SaleItemId}) | Omit<CreateSaleItem, 'saleId'>>}
>;

export class Sale extends AggregateRoot<SaleId> {
    companyId: CompanyId;
    sellerId: UserId;
    items: SaleItem[];
    note: string | null;

    // TODO: Add sale refund flow

    constructor(props: AllEntityProps<Sale>) {
        super(props);
        this.companyId = props.companyId;
        this.sellerId = props.sellerId;
        this.items = props.items;
        this.note = props.note;
        this.validate();
    }

    static create(props: CreateSale): Sale {
        const saleId = SaleId.generate();
        const now = new Date();

        return new Sale({
            ...props,
            id: saleId,
            note: props.note ?? null,
            items: props.items.map((item) => SaleItem.create({...item, saleId})),
            createdAt: now,
            updatedAt: now,
        });
    }

    toJSON(): EntityJson<Sale> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            sellerId: this.sellerId.toJSON(),
            items: this.items.map((item) => item.toJSON()),
            note: this.note,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    public getTotalValue(): number {
        return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    protected change(props: UpdateSale): void {
        if (props.note !== undefined) {
            this.note = props.note;
        }

        if (props.items !== undefined) {
            this.items = props.items.map((item) => {
                if ('id' in item) {
                    const existingSaleItem = this.items.find(({id}) => id.equals(item.id));

                    if (existingSaleItem === undefined) {
                        throw new ResourceNotFoundException('Sale item not found', item.id.toString());
                    }

                    existingSaleItem.change(item);

                    return existingSaleItem;
                }

                return SaleItem.create({...item, saleId: this.id});
            });
        }
    }

    private validate(...fields: Array<keyof SaleProps>): void {
        if (fields.length === 0) {
            if (this.items.length < 1) {
                throw new InvalidInputException('At least one product must be added to the sale.');
            }
        }
    }
}

export class SaleId extends EntityId<'SaleId'> {
    static from(value: string): SaleId {
        return new SaleId(value);
    }

    static generate(): SaleId {
        return new SaleId();
    }
}
