import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Service} from '../entities';

export class ServiceChangedEvent extends CompanyDomainEvent {
    static readonly type = 'SERVICE_CHANGED';
    readonly oldState: Service;
    readonly newState: Service;

    constructor(props: DomainEventProps<ServiceChangedEvent>) {
        super(ServiceChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
