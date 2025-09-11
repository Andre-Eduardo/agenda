import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Cleaning} from '../entities';

export class CleaningStartedEvent extends CompanyDomainEvent {
    static readonly type = 'CLEANING_STARTED';
    readonly cleaning: Cleaning;

    constructor(props: DomainEventProps<CleaningStartedEvent>) {
        super(CleaningStartedEvent.type, props);
        this.cleaning = props.cleaning;
    }
}
