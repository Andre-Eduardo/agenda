import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Stock} from '../entities';

export class StockChangedEvent extends CompanyDomainEvent {
    static readonly type = 'STOCK_CHANGED';
    readonly oldState: Stock;
    readonly newState: Stock;

    constructor(props: DomainEventProps<StockChangedEvent>) {
        super(StockChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
