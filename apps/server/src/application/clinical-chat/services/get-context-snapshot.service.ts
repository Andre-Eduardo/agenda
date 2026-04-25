import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ClinicId} from '../../../domain/clinic/entities';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {PatientId} from '../../../domain/patient/entities';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientContextSnapshot, ContextSnapshotStatus} from '../../../domain/clinical-chat/entities';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';
import {BuildPatientContextService} from './build-patient-context.service';
import {IndexPatientChunksService} from './index-patient-chunks.service';

export type GetContextSnapshotInput = {
    clinicId: ClinicId;
    patientId: PatientId;
    memberId?: ClinicMemberId | null;
    /**
     * If true, rebuild snapshot when STALE or missing.
     * If false, return existing snapshot (or null) without rebuild.
     * Default: true
     */
    autoRebuildIfStale?: boolean;
};

export type GetContextSnapshotOutput = {
    snapshot: PatientContextSnapshot | null;
    wasRebuilt: boolean;
    isStale: boolean;
};

/**
 * Efficient retrieval of a patient's clinical-context snapshot.
 *
 * Strategy:
 * - READY → return existing snapshot (fast path)
 * - STALE + autoRebuildIfStale=true → rebuild + reindex
 * - STALE + autoRebuildIfStale=false → return stale snapshot with flag
 * - PENDING/FAILED/missing + autoRebuildIfStale=true → build from scratch
 * - PENDING/FAILED/missing + autoRebuildIfStale=false → return null
 */
@Injectable()
export class GetContextSnapshotService {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly snapshotRepository: PatientContextSnapshotRepository,
        private readonly buildContextService: BuildPatientContextService,
        private readonly indexChunksService: IndexPatientChunksService,
    ) {}

    async execute(input: GetContextSnapshotInput): Promise<GetContextSnapshotOutput> {
        const {clinicId, patientId, memberId = null, autoRebuildIfStale = true} = input;

        const patient = await this.patientRepository.findById(patientId, clinicId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', patientId.toString());
        }

        const existing = await this.snapshotRepository.findByPatient(patientId, memberId);

        if (existing && existing.status === ContextSnapshotStatus.READY) {
            return {snapshot: existing, wasRebuilt: false, isStale: false};
        }

        const isStale =
            existing !== null &&
            (existing.status === ContextSnapshotStatus.STALE ||
                existing.status === ContextSnapshotStatus.FAILED);

        if (!autoRebuildIfStale) {
            return {snapshot: existing ?? null, wasRebuilt: false, isStale};
        }

        const context = await this.buildContextService.execute({
            clinicId,
            patientId,
            memberId,
        });

        await this.indexChunksService.execute({
            clinicId,
            patientId,
            context,
            reindex: true,
        });

        const rebuilt = await this.snapshotRepository.findByPatient(patientId, memberId);

        return {
            snapshot: rebuilt ?? null,
            wasRebuilt: true,
            isStale: false,
        };
    }
}
