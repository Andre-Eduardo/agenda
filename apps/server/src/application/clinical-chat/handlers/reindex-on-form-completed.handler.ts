import {Injectable, Logger} from '@nestjs/common';
import {OnEvent} from '@nestjs/event-emitter';
import {RebuildContextSnapshotService} from '@application/clinical-chat/services/rebuild-context-snapshot.service';
import {ModuleType} from '@domain/clinic-license/models';
import {ModuleAccess} from '@domain/clinic-license/services';
import type {Event} from '@domain/event';
import {PatientFormCompletedEvent} from '@domain/patient-form/events';

@Injectable()
export class ReindexOnFormCompletedHandler {
    private readonly logger = new Logger(ReindexOnFormCompletedHandler.name);

    constructor(
        private readonly rebuildContextSnapshot: RebuildContextSnapshotService,
        private readonly moduleAccess: ModuleAccess
    ) {}

    @OnEvent(PatientFormCompletedEvent.type)
    async handle({actor, payload}: Event<PatientFormCompletedEvent>): Promise<void> {
        try {
            // Indexa por clínica, não por quem salvou: o colega liberado precisa do paciente indexado.
            if (
                !(await this.moduleAccess.isClinicModuleEnabled(
                    actor.clinicId,
                    ModuleType.AI_CHAT,
                    ModuleType.AI_AGENT
                ))
            ) {
                return;
            }

            await this.rebuildContextSnapshot.execute({
                actor,
                payload: {patientId: payload.patientId, reindex: true},
            });
        } catch (error) {
            this.logger.error(
                `Failed to reindex context for patient ${payload.patientId.toString()} after form ${payload.formId.toString()} completed`,
                error instanceof Error ? error.stack : String(error)
            );
        }
    }
}
