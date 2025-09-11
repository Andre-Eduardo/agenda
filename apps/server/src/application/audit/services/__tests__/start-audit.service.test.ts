import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import type {AuditRepository} from '../../../../domain/audit/audit.repository';
import {Audit} from '../../../../domain/audit/entities';
import {fakeAudit} from '../../../../domain/audit/entities/__tests__/fake-audit';
import {AuditStartedEvent} from '../../../../domain/audit/events';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {StartAuditDto} from '../../dtos';
import {AuditDto} from '../../dtos';
import {StartAuditService} from '../start-audit.service';

describe('A start-audit service', () => {
    const auditRepository = mock<AuditRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const startAuditService = new StartAuditService(auditRepository, roomStateService, eventDispatcher);

    const companyId = CompanyId.generate();
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

    it('should start an audit', async () => {
        const payload = {
            companyId,
            roomId: RoomId.generate(),
            startedById: UserId.generate(),
            reason: 'audit reason',
        };

        const audit = Audit.start(payload);

        jest.spyOn(Audit, 'start').mockReturnValue(audit);
        jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(startAuditService.execute({actor, payload})).resolves.toEqual(new AuditDto(audit));

        expect(Audit.start).toHaveBeenCalledWith({...payload});

        expect(audit.events).toHaveLength(1);
        expect(audit.events[0]).toBeInstanceOf(AuditStartedEvent);
        expect(audit.events).toEqual([
            {
                type: AuditStartedEvent.type,
                companyId,
                audit,
                timestamp: now,
            },
        ]);
        expect(auditRepository.save).toHaveBeenCalledWith(audit);
        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(payload.roomId, {
            type: RoomStateEvent.AUDIT,
            auditTimeout: 60 * 60,
        });
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, audit);
    });

    it('should fail to start the audit when there is already an audit in the given room', async () => {
        const payload: StartAuditDto = {
            companyId,
            roomId: RoomId.generate(),
            startedById: UserId.generate(),
            reason: 'audit reason',
        };

        jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(fakeAudit(payload));

        await expect(startAuditService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'There is already an audit in this room.'
        );

        expect(auditRepository.save).not.toHaveBeenCalled();
        expect(roomStateService.changeRoomState).not.toHaveBeenCalled();
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the audit', async () => {
        const payload: StartAuditDto = {
            companyId,
            roomId: RoomId.generate(),
            startedById: UserId.generate(),
            reason: 'audit reason',
        };

        const audit = fakeAudit(payload);

        jest.spyOn(Audit, 'start').mockReturnValue(audit);
        jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(null);
        jest.spyOn(auditRepository, 'save').mockRejectedValueOnce(new Error('Unexpected error'));

        await expect(startAuditService.execute({actor, payload})).rejects.toThrowWithMessage(Error, 'Unexpected error');

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
