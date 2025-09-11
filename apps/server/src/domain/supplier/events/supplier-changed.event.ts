import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Supplier} from '../entities';

export class SupplierChangedEvent extends CompanyDomainEvent {
    static readonly type = 'SUPPLIER_CHANGED';
    readonly oldState: Supplier;
    readonly newState: Supplier;

    constructor(props: DomainEventProps<SupplierChangedEvent>) {
        super(SupplierChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
