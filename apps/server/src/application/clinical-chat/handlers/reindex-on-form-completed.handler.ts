import {Injectable, Logger} from '@nestjs/common';
import {OnEvent} from '@nestjs/event-emitter';
import type {Event} from '../../../domain/event';
import {PatientFormCompletedEvent} from '../../../domain/patient-form/events';
import {RebuildContextSnapshotService} from '../services/rebuild-context-snapshot.service';

@Injectable()
export class ReindexOnFormCompletedHandler {
    private readonly logger = new Logger(ReindexOnFormCompletedHandler.name);

    constructor(private readonly rebuildContextSnapshot: RebuildContextSnapshotService) {}

    @OnEvent(PatientFormCompletedEvent.type)
    async handle({actor, payload}: Event<PatientFormCompletedEvent>): Promise<void> {
        try {
            await this.rebuildContextSnapshot.execute({
                actor,
                payload: {patientId: payload.patientId, reindex: true},
            });
        } catch (err) {
            this.logger.error(
                `Failed to reindex context for patient ${payload.patientId.toString()} after form ${payload.formId.toString()} completed`,
                err instanceof Error ? err.stack : String(err),
            );
        }
    }
}
