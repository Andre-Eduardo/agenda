import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Defect} from '../entities';

export class DefectDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'DEFECT_DELETED';
    readonly defect: Defect;

    constructor(props: DomainEventProps<DefectDeletedEvent>) {
        super(DefectDeletedEvent.type, props);
        this.defect = props.defect;
    }
}
