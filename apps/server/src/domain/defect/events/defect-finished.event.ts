import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {UserId} from '../../user/entities';
import type {DefectId} from '../entities';

export class DefectFinishedEvent extends CompanyDomainEvent {
    static readonly type = 'DEFECT_FINISHED';
    readonly defectId: DefectId;
    readonly finishedById: UserId;

    constructor(props: DomainEventProps<DefectFinishedEvent>) {
        super(DefectFinishedEvent.type, props);
        this.defectId = props.defectId;
        this.finishedById = props.finishedById;
    }
}
