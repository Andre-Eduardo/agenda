import { Injectable } from "@nestjs/common";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientId } from "@domain/patient/entities";
import { ApplicationService, Command } from "@application/@shared/application.service";
import {
  BuildPatientContextService,
  type PatientContextOutput,
} from "@application/clinical-chat/services/build-patient-context.service";
import {
  IndexPatientChunksService,
  type IndexPatientChunksOutput,
} from "@application/clinical-chat/services/index-patient-chunks.service";

export type RebuildContextSnapshotInput = {
  patientId: PatientId;
  memberId?: ClinicMemberId | null;
  reindex?: boolean;
};

export type RebuildContextSnapshotOutput = {
  context: PatientContextOutput;
  indexing: IndexPatientChunksOutput;
};

/**
 * Orchestrates full reconstruction of a patient's clinical context and
 * re-indexes chunks. Endpoint to force a refresh when records/forms change.
 */
@Injectable()
export class RebuildContextSnapshotService implements ApplicationService<
  RebuildContextSnapshotInput,
  RebuildContextSnapshotOutput
> {
  constructor(
    private readonly buildContextService: BuildPatientContextService,
    private readonly indexChunksService: IndexPatientChunksService,
  ) {}

  async execute({
    actor,
    payload,
  }: Command<RebuildContextSnapshotInput>): Promise<RebuildContextSnapshotOutput> {
    const context = await this.buildContextService.execute({
      clinicId: actor.clinicId,
      patientId: payload.patientId,
      memberId: payload.memberId ?? null,
    });

    const indexing = await this.indexChunksService.execute({
      clinicId: actor.clinicId,
      patientId: payload.patientId,
      context,
      reindex: payload.reindex ?? true,
    });

    return { context, indexing };
  }
}
