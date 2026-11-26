import type {ClinicId} from '@domain/clinic/entities';
import type {PatientCommunicationPreferenceChange} from '@domain/patient-communication-preference/entities';
import type {PatientId} from '@domain/patient/entities';

export interface PatientCommunicationPreferenceRepository {
    /**
     * Stores the change unless one with the same `source` + `externalId` already exists.
     * Returns `false` for a duplicate, which keeps webhook-triggered opt-outs idempotent.
     */
    recordIfAbsent(change: PatientCommunicationPreferenceChange): Promise<boolean>;
    /** The patient's change history in the clinic, newest first. */
    findHistory(clinicId: ClinicId, patientId: PatientId): Promise<PatientCommunicationPreferenceChange[]>;
}

export abstract class PatientCommunicationPreferenceRepository {}
