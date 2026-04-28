import {Injectable} from '@nestjs/common';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {PatientId} from '../../../domain/patient/entities';
import {ContextSnapshotStatus} from '../../../domain/clinical-chat/entities';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';

export type InvalidateSnapshotInput = {
    patientId: PatientId;
    memberId?: ClinicMemberId | null;
    /** Razão da invalidação, para fins de rastreabilidade */
    reason?: string;
};

export type InvalidateSnapshotOutput = {
    invalidated: boolean;
    previousStatus: ContextSnapshotStatus | null;
};

/**
 * Task 6 — Invalida o snapshot clínico de um paciente, marcando-o como STALE.
 *
 * Deve ser chamado sempre que dados relevantes do paciente forem alterados:
 * - Novo Record criado ou atualizado
 * - Novo PatientForm preenchido
 * - PatientAlert criado, ativado ou desativado
 * - ClinicalProfile atualizado
 *
 * Após a invalidação, o próximo acesso ao snapshot via `GetContextSnapshotService`
 * com `autoRebuildIfStale=true` irá reconstruir automaticamente.
 *
 * PONTO DE INTEGRAÇÃO FUTURA (event-driven):
 * Criar um event listener que chama este service quando:
 * - RecordCreatedEvent / RecordUpdatedEvent
 * - PatientFormCompletedEvent
 * - PatientAlertChangedEvent
 * - ClinicalProfileUpdatedEvent
 */
@Injectable()
export class InvalidateSnapshotService {
    constructor(private readonly snapshotRepository: PatientContextSnapshotRepository) {}

    async execute(input: InvalidateSnapshotInput): Promise<InvalidateSnapshotOutput> {
        const {patientId, memberId = null} = input;

        const snapshot = await this.snapshotRepository.findByPatient(patientId, memberId);

        if (!snapshot) {
            return {invalidated: false, previousStatus: null};
        }

        if (snapshot.status === ContextSnapshotStatus.STALE) {
            // Já está stale — idempotente
            return {invalidated: false, previousStatus: ContextSnapshotStatus.STALE};
        }

        const previousStatus = snapshot.status;

        snapshot.markStale();
        await this.snapshotRepository.save(snapshot);

        return {invalidated: true, previousStatus};
    }
}
