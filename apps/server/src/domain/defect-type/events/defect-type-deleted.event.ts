import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {DefectType} from '../entities';

export class DefectTypeDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'DEFECT_TYPE_DELETED';
    readonly defectType: DefectType;

    constructor(props: DomainEventProps<DefectTypeDeletedEvent>) {
        super(DefectTypeDeletedEvent.type, props);
        this.defectType = props.defectType;
    }
}
