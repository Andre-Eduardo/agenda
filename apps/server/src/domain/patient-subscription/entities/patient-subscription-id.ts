import {EntityId} from '@domain/@shared/entity/id';

export class PatientSubscriptionId extends EntityId<'PatientSubscriptionId'> {
    static from(value: string): PatientSubscriptionId {
        return new PatientSubscriptionId(value);
    }

    static generate(): PatientSubscriptionId {
        return new PatientSubscriptionId();
    }
}
