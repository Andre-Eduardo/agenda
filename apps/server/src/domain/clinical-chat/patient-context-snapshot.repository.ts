import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type {
  PatientContextSnapshot,
  PatientContextSnapshotId,
} from "@domain/clinical-chat/entities";

export interface PatientContextSnapshotRepository {
  findById(id: PatientContextSnapshotId): Promise<PatientContextSnapshot | null>;

  /** Retorna o snapshot mais recente de um paciente, opcionalmente filtrado por membro. */
  findByPatient(
    patientId: PatientId,
    memberId?: ClinicMemberId | null,
  ): Promise<PatientContextSnapshot | null>;

  save(snapshot: PatientContextSnapshot): Promise<void>;
}

export abstract class PatientContextSnapshotRepository {}
