import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';
import type {PatientContextSnapshot, PatientContextSnapshotId} from './entities';

export interface PatientContextSnapshotRepository {
    findById(id: PatientContextSnapshotId): Promise<PatientContextSnapshot | null>;

    /** Retorna o snapshot mais recente de um paciente, opcionalmente filtrado por profissional. */
    findByPatient(
        patientId: PatientId,
        professionalId?: ProfessionalId | null
    ): Promise<PatientContextSnapshot | null>;

    save(snapshot: PatientContextSnapshot): Promise<void>;
}

export abstract class PatientContextSnapshotRepository {}
