import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {DraftEvolutionId} from '../entities/draft-evolution.entity';
import type {ClinicMemberId} from '../../clinic-member/entities';
import type {RecordId} from '../../record/entities/record.entity';

export class DraftApprovedEvent extends DomainEvent {
    static readonly type = 'DRAFT_EVOLUTION_APPROVED';
    readonly draftId: DraftEvolutionId;
    readonly recordId: RecordId;
    readonly approvedByMemberId: ClinicMemberId;

    constructor(props: DomainEventProps<DraftApprovedEvent>) {
        super(DraftApprovedEvent.type, props.timestamp);
        this.draftId = props.draftId;
        this.recordId = props.recordId;
        this.approvedByMemberId = props.approvedByMemberId;
    }
}
