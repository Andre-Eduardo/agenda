import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {DefectType} from '../entities';

export class DefectTypeCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'DEFECT_TYPE_CREATED';
    readonly defectType: DefectType;

    constructor(props: DomainEventProps<DefectTypeCreatedEvent>) {
        super(DefectTypeCreatedEvent.type, props);
        this.defectType = props.defectType;
    }
}
