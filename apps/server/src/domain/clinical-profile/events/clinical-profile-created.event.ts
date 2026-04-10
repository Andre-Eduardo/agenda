import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {ClinicalProfile} from '../entities';

export class ClinicalProfileCreatedEvent extends DomainEvent {
    static readonly type = 'CLINICAL_PROFILE_CREATED';
    readonly profile: ClinicalProfile;

    constructor(props: DomainEventProps<ClinicalProfileCreatedEvent>) {
        super(ClinicalProfileCreatedEvent.type, props.timestamp);
        this.profile = props.profile;
    }
}
