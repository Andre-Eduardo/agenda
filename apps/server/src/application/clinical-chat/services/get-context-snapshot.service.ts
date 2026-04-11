import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientContextSnapshot, ContextSnapshotStatus} from '../../../domain/clinical-chat/entities';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';
import {BuildPatientContextService} from './build-patient-context.service';
import {IndexPatientChunksService} from './index-patient-chunks.service';

export type GetContextSnapshotInput = {
    patientId: PatientId;
    professionalId?: ProfessionalId | null;
    /**
     * Se true, reconstrói o snapshot quando estiver STALE ou ausente.
     * Se false, retorna o snapshot existente mesmo que estale (ou null se ausente).
     * Padrão: true
     */
    autoRebuildIfStale?: boolean;
};

export type GetContextSnapshotOutput = {
    snapshot: PatientContextSnapshot | null;
    wasRebuilt: boolean;
    isStale: boolean;
};

/**
 * Task 6 — Serviço de recuperação eficiente de snapshot clínico por paciente.
 *
 * Estratégia:
 * - READY → retorna snapshot existente sem custo adicional
 * - STALE + autoRebuildIfStale=true → reconstrói e re-indexa antes de retornar
 * - STALE + autoRebuildIfStale=false → retorna snapshot stale com flag
 * - PENDING/FAILED/ausente + autoRebuildIfStale=true → constrói do zero
 * - PENDING/FAILED/ausente + autoRebuildIfStale=false → retorna null
 *
 * O snapshot é o bloco de contexto principal para prompts de IA:
 * contém patientFacts, criticalContext e timelineSummary prontos para uso.
 */
@Injectable()
export class GetContextSnapshotService {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly snapshotRepository: PatientContextSnapshotRepository,
        private readonly buildContextService: BuildPatientContextService,
        private readonly indexChunksService: IndexPatientChunksService
    ) {}

    async execute(input: GetContextSnapshotInput): Promise<GetContextSnapshotOutput> {
        const {patientId, professionalId = null, autoRebuildIfStale = true} = input;

        // Valida que o paciente existe
        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', patientId.toString());
        }

        const existing = await this.snapshotRepository.findByPatient(patientId, professionalId);

        // Snapshot READY → retorna diretamente (caminho rápido)
        if (existing && existing.status === ContextSnapshotStatus.READY) {
            return {snapshot: existing, wasRebuilt: false, isStale: false};
        }

        const isStale =
            existing !== null &&
            (existing.status === ContextSnapshotStatus.STALE ||
                existing.status === ContextSnapshotStatus.FAILED);

        // Sem snapshot ou stale + rebuild desabilitado → retorna o que tem
        if (!autoRebuildIfStale) {
            return {snapshot: existing ?? null, wasRebuilt: false, isStale};
        }

        // Reconstrói o snapshot (build + indexação)
        const context = await this.buildContextService.execute({
            patientId,
            professionalId,
        });

        await this.indexChunksService.execute({
            patientId,
            context,
            reindex: true,
        });

        // Busca o snapshot recém-persistido pelo BuildPatientContextService
        const rebuilt = await this.snapshotRepository.findByPatient(patientId, professionalId);

        return {
            snapshot: rebuilt ?? null,
            wasRebuilt: true,
            isStale: false,
        };
    }
}
