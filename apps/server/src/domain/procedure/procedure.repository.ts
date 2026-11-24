import type {ClinicId} from '@domain/clinic/entities';
import type {Procedure, ProcedureId} from '@domain/procedure/procedure.entity';

export interface ProcedureRepository {
    list(clinicId: ClinicId, includeInactive: boolean): Promise<Procedure[]>;
    findActive(clinicId: ClinicId, id: ProcedureId): Promise<Procedure | null>;
    create(procedure: Procedure): Promise<Procedure>;
    update(procedure: Procedure): Promise<Procedure | null>;
}

export const ProcedureRepository = Symbol('ProcedureRepository');
