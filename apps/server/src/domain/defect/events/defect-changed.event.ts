import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Defect} from '../entities';

export class DefectChangedEvent extends CompanyDomainEvent {
    static readonly type = 'DEFECT_CHANGED';
    readonly oldState: Defect;
    readonly newState: Defect;

    constructor(props: DomainEventProps<DefectChangedEvent>) {
        super(DefectChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
