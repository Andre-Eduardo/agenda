import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {AuditRepository} from '../../../../domain/audit/audit.repository';
import {AuditEndReasonType} from '../../../../domain/audit/entities';
import {fakeAudit} from '../../../../domain/audit/entities/__tests__/fake-audit';
import {AuditFinishedEvent} from '../../../../domain/audit/events';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {RoomState, RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {FinishAuditDto} from '../../dtos';
import {AuditDto} from '../../dtos';
import {FinishAuditService} from '../finish-audit.service';

describe('A finish-audit service', () => {
    const auditRepository = mock<AuditRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const finishAuditService = new FinishAuditService(auditRepository, roomStateService, eventDispatcher);

    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();
    const responsible = UserId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it.each(['a', undefined])('should finish an audit', async (note) => {
        const existingAudit = fakeAudit({companyId, roomId, startedById: responsible});

        const payload: FinishAuditDto = {
            roomId,
            note,
            nextRoomState: RoomState.VACANT,
        };

        const finishedAudit = fakeAudit({
            ...existingAudit,
            companyId,
            roomId: payload.roomId,
            finishedById: actor.userId,
            finishedAt: now,
            note: payload.note ?? null,
            endReason: AuditEndReasonType.COMPLETED,
            updatedAt: now,
        });

        jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(existingAudit);

        await expect(finishAuditService.execute({actor, payload})).resolves.toEqual(new AuditDto(finishedAudit));

        expect(existingAudit.events).toHaveLength(1);
        expect(existingAudit.events[0]).toBeInstanceOf(AuditFinishedEvent);
        expect(existingAudit.events).toEqual([
            {
                type: AuditFinishedEvent.type,
                companyId: existingAudit.companyId,
                auditId: existingAudit.id,
                finishedById: actor.userId,
                endReason: AuditEndReasonType.COMPLETED,
                timestamp: now,
            },
        ]);
        expect(auditRepository.findByRoom).toHaveBeenCalledWith(roomId);
        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(roomId, {
            type: RoomStateEvent.COMPLETE_AUDIT_VACANT,
        });
        expect(auditRepository.save).toHaveBeenCalledWith(existingAudit);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingAudit);
    });

    it('should throw and error when the audit does not exist', async () => {
        const payload: FinishAuditDto = {
            roomId,
            note: 'Audit took longer than expected',
            nextRoomState: RoomState.VACANT,
        };

        jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(finishAuditService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Audit not found for room'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the audit', async () => {
        const existingAudit = fakeAudit({companyId, roomId, startedById: responsible});

        const payload: FinishAuditDto = {
            roomId,
            note: 'Audit took longer than expected',
            nextRoomState: RoomState.VACANT,
        };

        jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(existingAudit);
        jest.spyOn(auditRepository, 'save').mockRejectedValueOnce(new Error('Unexpected error'));

        await expect(finishAuditService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });
});
