import {EntityId} from '@domain/@shared/entity/id';

export class PatientPackageId extends EntityId<'PatientPackageId'> {
    static from(value: string): PatientPackageId {
        return new PatientPackageId(value);
    }

    static generate(): PatientPackageId {
        return new PatientPackageId();
    }
}
