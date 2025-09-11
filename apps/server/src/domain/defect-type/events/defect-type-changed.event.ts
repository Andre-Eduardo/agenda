import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {DefectType} from '../entities';

export class DefectTypeChangedEvent extends CompanyDomainEvent {
    static readonly type = 'DEFECT_TYPE_CHANGED';
    readonly oldState: DefectType;
    readonly newState: DefectType;

    constructor(props: DomainEventProps<DefectTypeChangedEvent>) {
        super(DefectTypeChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
