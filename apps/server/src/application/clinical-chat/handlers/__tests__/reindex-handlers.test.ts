import {mock} from 'jest-mock-extended';
import {ReindexOnFormCompletedHandler} from '@application/clinical-chat/handlers/reindex-on-form-completed.handler';
import {ReindexOnRecordSavedHandler} from '@application/clinical-chat/handlers/reindex-on-record-saved.handler';
import type {RebuildContextSnapshotService} from '@application/clinical-chat/services/rebuild-context-snapshot.service';
import type {Actor} from '@domain/@shared/actor';
import {ModuleType} from '@domain/clinic-license/models';
import type {ModuleAccess} from '@domain/clinic-license/services';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import type {Event} from '@domain/event';
import type {PatientFormCompletedEvent} from '@domain/patient-form/events';
import {PatientId} from '@domain/patient/entities';
import type {RecordSavedEvent} from '@domain/record/events';
import {UserId} from '@domain/user/entities';

const actor: Actor = {
    userId: UserId.generate(),
    clinicId: ClinicId.generate(),
    clinicMemberId: ClinicMemberId.generate(),
    ip: '127.0.0.1',
};
const patientId = PatientId.generate();

function setup(enabled: boolean) {
    const rebuild = mock<RebuildContextSnapshotService>();
    const moduleAccess = mock<ModuleAccess>();

    moduleAccess.isClinicModuleEnabled.mockResolvedValue(enabled);

    return {rebuild, moduleAccess};
}

function recordEvent(): Event<RecordSavedEvent> {
    return mock<Event<RecordSavedEvent>>({actor, payload: {patientId, action: 'created'}});
}

function formEvent(): Event<PatientFormCompletedEvent> {
    return mock<Event<PatientFormCompletedEvent>>({actor, payload: {patientId}});
}

describe('Context reindex handlers', () => {
    it.each([
        [
            'record saved',
            (r: RebuildContextSnapshotService, m: ModuleAccess) =>
                new ReindexOnRecordSavedHandler(r, m).handle(recordEvent()),
        ],
        [
            'form completed',
            (r: RebuildContextSnapshotService, m: ModuleAccess) =>
                new ReindexOnFormCompletedHandler(r, m).handle(formEvent()),
        ],
    ])('skip embeddings on %s when the clinic has no chat or agent module', async (_, run) => {
        const {rebuild, moduleAccess} = setup(false);

        await run(rebuild, moduleAccess);

        expect(moduleAccess.isClinicModuleEnabled).toHaveBeenCalledWith(
            actor.clinicId,
            ModuleType.AI_CHAT,
            ModuleType.AI_AGENT
        );
        expect(rebuild.execute).not.toHaveBeenCalled();
    });

    it.each([
        [
            'record saved',
            (r: RebuildContextSnapshotService, m: ModuleAccess) =>
                new ReindexOnRecordSavedHandler(r, m).handle(recordEvent()),
        ],
        [
            'form completed',
            (r: RebuildContextSnapshotService, m: ModuleAccess) =>
                new ReindexOnFormCompletedHandler(r, m).handle(formEvent()),
        ],
    ])('reindex on %s when the clinic has the module', async (_, run) => {
        const {rebuild, moduleAccess} = setup(true);

        await run(rebuild, moduleAccess);

        expect(rebuild.execute).toHaveBeenCalledWith({actor, payload: {patientId, reindex: true}});
    });
});
