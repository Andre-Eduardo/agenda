import {EntityId} from '@domain/@shared/entity/id';
import type {ClinicId} from '@domain/clinic/entities';

export enum ProcedureColor {
    BLUE = 'BLUE',
    GREEN = 'GREEN',
    AMBER = 'AMBER',
    RED = 'RED',
}

export enum ProcedureModality {
    IN_PERSON = 'IN_PERSON',
    REMOTE = 'REMOTE',
}

export type ProcedureDetails = {
    name: string;
    durationMinutes: number;
    color: ProcedureColor;
    priceInCents: number;
    modality: ProcedureModality;
};

export type Procedure = ProcedureDetails & {
    id: ProcedureId;
    clinicId: ClinicId;
    active: boolean;
};

export type ScheduledProcedure = Readonly<Omit<ProcedureDetails, 'durationMinutes'> & {id: string}>;
export type ProcedureOverrides = Partial<Pick<ProcedureDetails, 'color' | 'priceInCents' | 'modality'>>;

export class ProcedureId extends EntityId<'ProcedureId'> {
    static from(value: string): ProcedureId {
        return new ProcedureId(value);
    }

    static generate(): ProcedureId {
        return new ProcedureId();
    }
}
