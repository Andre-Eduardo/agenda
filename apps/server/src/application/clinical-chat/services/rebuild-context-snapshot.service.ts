import {Injectable} from '@nestjs/common';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {ApplicationService, Command} from '../../@shared/application.service';
import {BuildPatientContextService, type PatientContextOutput} from './build-patient-context.service';
import {IndexPatientChunksService, type IndexPatientChunksOutput} from './index-patient-chunks.service';

export type RebuildContextSnapshotInput = {
    patientId: PatientId;
    professionalId?: ProfessionalId | null;
    reindex?: boolean;
};

export type RebuildContextSnapshotOutput = {
    context: PatientContextOutput;
    indexing: IndexPatientChunksOutput;
};

/**
 * Orquestra a reconstrução completa do contexto clínico e re-indexação de chunks.
 * Endpoint para forçar atualização quando records ou formulários mudam.
 *
 * Pode ser chamado:
 * - Manualmente pelo profissional
 * - Automaticamente via event listener quando Record ou PatientForm é criado/atualizado
 */
@Injectable()
export class RebuildContextSnapshotService
    implements ApplicationService<RebuildContextSnapshotInput, RebuildContextSnapshotOutput>
{
    constructor(
        private readonly buildContextService: BuildPatientContextService,
        private readonly indexChunksService: IndexPatientChunksService
    ) {}

    async execute({payload}: Command<RebuildContextSnapshotInput>): Promise<RebuildContextSnapshotOutput> {
        const context = await this.buildContextService.execute({
            patientId: payload.patientId,
            professionalId: payload.professionalId ?? null,
        });

        const indexing = await this.indexChunksService.execute({
            patientId: payload.patientId,
            context,
            reindex: payload.reindex ?? true,
        });

        return {context, indexing};
    }
}
