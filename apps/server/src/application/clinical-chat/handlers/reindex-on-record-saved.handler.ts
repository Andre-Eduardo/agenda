import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import type { Event } from "@domain/event";
import { RecordSavedEvent } from "@domain/record/events";
import { RebuildContextSnapshotService } from "@application/clinical-chat/services/rebuild-context-snapshot.service";

@Injectable()
export class ReindexOnRecordSavedHandler {
  private readonly logger = new Logger(ReindexOnRecordSavedHandler.name);

  constructor(private readonly rebuildContextSnapshot: RebuildContextSnapshotService) {}

  @OnEvent(RecordSavedEvent.type)
  async handle({ actor, payload }: Event<RecordSavedEvent>): Promise<void> {
    try {
      await this.rebuildContextSnapshot.execute({
        actor,
        payload: { patientId: payload.patientId, reindex: true },
      });
    } catch (error) {
      this.logger.error(
        `Failed to reindex context for patient ${payload.patientId.toString()} after record ${payload.action}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
