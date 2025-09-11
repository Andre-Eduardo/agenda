import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Stock} from '../entities';

export class StockDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'STOCK_DELETED';
    readonly stock: Stock;

    constructor(props: DomainEventProps<StockDeletedEvent>) {
        super(StockDeletedEvent.type, props);
        this.stock = props.stock;
    }
}
