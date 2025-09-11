import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Defect} from '../entities';

export class DefectCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'DEFECT_CREATED';
    readonly defect: Defect;

    constructor(props: DomainEventProps<DefectCreatedEvent>) {
        super(DefectCreatedEvent.type, props);
        this.defect = props.defect;
    }
}
