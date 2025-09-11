import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {DeepCleaning} from '../entities';

export class DeepCleaningStartedEvent extends CompanyDomainEvent {
    static readonly type = 'DEEP_CLEANING_STARTED';

    readonly deepCleaning: DeepCleaning;

    constructor(props: DomainEventProps<DeepCleaningStartedEvent>) {
        super(DeepCleaningStartedEvent.type, props);
        this.deepCleaning = props.deepCleaning;
    }
}
