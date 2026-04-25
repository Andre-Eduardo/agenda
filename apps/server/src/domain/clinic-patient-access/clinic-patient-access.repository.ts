import type {ClinicId} from '../clinic/entities';
import type {ClinicMemberId} from '../clinic-member/entities';
import type {PatientId} from '../patient/entities';
import type {ClinicPatientAccess, ClinicPatientAccessId} from './entities';

export interface ClinicPatientAccessRepository {
    findById(id: ClinicPatientAccessId): Promise<ClinicPatientAccess | null>;
    findByMemberAndPatient(memberId: ClinicMemberId, patientId: PatientId): Promise<ClinicPatientAccess | null>;
    findByPatientId(clinicId: ClinicId, patientId: PatientId): Promise<ClinicPatientAccess[]>;
    findByMemberId(clinicId: ClinicId, memberId: ClinicMemberId): Promise<ClinicPatientAccess[]>;
    save(access: ClinicPatientAccess): Promise<void>;
}

export abstract class ClinicPatientAccessRepository {}
