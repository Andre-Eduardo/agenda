import type {AllEntityProps, CreateEntity, EntityJson} from '../../@shared/entity';
import type {PersonId} from '../../person/entities';
import {DirectSaleChangedEvent, DirectSaleCreatedEvent} from '../events';
import type {CreateSale, UpdateSale} from './sale.entity';
import {Sale} from './sale.entity';

export type CreateDirectSale = Omit<CreateEntity<DirectSale>, keyof Sale> & CreateSale;
export type UpdateDirectSale = UpdateSale;

export class DirectSale extends Sale {
    buyerId: PersonId | null;

    constructor(props: AllEntityProps<DirectSale>) {
        super(props);
        this.buyerId = props.buyerId;
    }

    static create(props: CreateDirectSale): DirectSale {
        const sale = Sale.create(props);

        const directSale = new DirectSale({
            ...sale,
            buyerId: props.buyerId ?? null,
        });

        directSale.addEvent(
            new DirectSaleCreatedEvent({companyId: props.companyId, directSale, timestamp: directSale.createdAt})
        );

        return directSale;
    }

    change(props: UpdateDirectSale) {
        const oldDirectSale = new DirectSale(this);

        super.change(props);

        this.addEvent(new DirectSaleChangedEvent({companyId: this.companyId, oldState: oldDirectSale, newState: this}));
    }

    toJSON(): EntityJson<DirectSale> {
        return {
            ...super.toJSON(),
            buyerId: this.buyerId?.toJSON() ?? null,
        };
    }
}
