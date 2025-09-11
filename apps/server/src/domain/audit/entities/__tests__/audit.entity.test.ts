import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {AuditFinishedEvent, AuditStartedEvent} from '../../events';
import type {StartAudit} from '../audit.entity';
import {AuditEndReasonType, Audit} from '../audit.entity';
import {fakeAudit} from './fake-audit';

describe('An audit', () => {
    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();
    const now = new Date(1000);

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on start', () => {
        it('should emit a audit-started event', () => {
            const data: StartAudit = {
                companyId,
                roomId,
                startedById: UserId.generate(),
                reason: 'Audit reason',
            };

            const audit = Audit.start(data);

            expect(audit.id).toBeInstanceOf(RoomStatusId);
            expect(audit.companyId).toBeInstanceOf(CompanyId);
            expect(audit.roomId).toBeInstanceOf(RoomId);
            expect(audit.startedById).toBeInstanceOf(UserId);
            expect(audit.startedById).toBe(data.startedById);
            expect(audit.startedAt).toEqual(now);
            expect(audit.reason).toBe(data.reason);
            expect(audit.finishedById).toBeNull();
            expect(audit.finishedAt).toBeNull();
            expect(audit.endReason).toBeNull();
            expect(audit.note).toBeNull();
            expect(audit.createdAt).toEqual(now);
            expect(audit.updatedAt).toEqual(now);

            expect(audit.events).toEqual([
                {
                    type: AuditStartedEvent.type,
                    companyId,
                    audit,
                    timestamp: now,
                },
            ]);
            expect(audit.events[0]).toBeInstanceOf(AuditStartedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            expect(() => fakeAudit({reason: ''})).toThrowWithMessage(
                InvalidInputException,
                'Audit reason must be at least 1 character long.'
            );
        });
    });

    describe('on finish', () => {
        it.each([
            [AuditEndReasonType.EXPIRED, undefined],
            [AuditEndReasonType.COMPLETED, 'Audit note'],
            [AuditEndReasonType.COMPLETED, null],
        ])('should emit a audit-finished event', (endReason, note) => {
            const existingAudit = fakeAudit({companyId, roomId});
            const finishedById = UserId.generate();

            const payload =
                endReason === AuditEndReasonType.EXPIRED ? {endReason} : {endReason, finishedById, note: note ?? null};

            existingAudit.finish(payload);

            expect(existingAudit.companyId).toBe(companyId);
            expect(existingAudit.roomId).toBe(roomId);
            expect(existingAudit.finishedById).toBe(
                endReason === AuditEndReasonType.EXPIRED ? existingAudit.startedById : finishedById
            );
            expect(existingAudit.endReason).toBe(endReason);
            expect(existingAudit.note).toBe(note ?? null);
            expect(existingAudit.createdAt).toEqual(now);
            expect(existingAudit.updatedAt).toEqual(now);

            expect(existingAudit.events).toEqual([
                {
                    type: AuditFinishedEvent.type,
                    companyId,
                    endReason,
                    auditId: existingAudit.id,
                    finishedById: existingAudit.finishedById,
                    timestamp: now,
                },
            ]);
            expect(existingAudit.events[0]).toBeInstanceOf(AuditFinishedEvent);
        });

        it('should emit a audit-finished event when expired', () => {
            const existingAudit = fakeAudit({companyId, roomId});

            existingAudit.finish({endReason: AuditEndReasonType.EXPIRED});

            expect(existingAudit.finishedById).toBe(existingAudit.startedById);
            expect(existingAudit.endReason).toBe(AuditEndReasonType.EXPIRED);
            expect(existingAudit.finishedAt).toEqual(now);

            expect(existingAudit.events).toEqual([
                {
                    type: AuditFinishedEvent.type,
                    companyId,
                    endReason: AuditEndReasonType.EXPIRED,
                    auditId: existingAudit.id,
                    finishedById: existingAudit.finishedById,
                    timestamp: now,
                },
            ]);
            expect(existingAudit.events[0]).toBeInstanceOf(AuditFinishedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const existingAudit = fakeAudit({companyId, roomId});

            const payload = {finishedById: UserId.generate(), note: '', endReason: AuditEndReasonType.COMPLETED};

            expect(() => existingAudit.finish(payload)).toThrowWithMessage(
                InvalidInputException,
                'Audit note must be at least 1 character long.'
            );
        });
    });

    it.each([
        {
            finishedById: null,
            endReason: null,
            note: null,
        },
        {
            finishedById: UserId.generate(),
            endReason: AuditEndReasonType.COMPLETED,
            note: 'Audit note',
        },
        {
            finishedById: UserId.generate(),
            endReason: AuditEndReasonType.COMPLETED,
            note: null,
        },
    ])('should be serializable', ({finishedById, endReason, note}) => {
        const audit = fakeAudit({
            companyId,
            roomId,
            finishedById,
            endReason,
            note,
        });

        expect(audit.toJSON()).toEqual({
            id: audit.id.toJSON(),
            companyId: audit.companyId.toJSON(),
            roomId: audit.roomId.toJSON(),
            startedById: audit.startedById.toJSON(),
            startedAt: audit.startedAt.toJSON(),
            finishedById: audit.finishedById?.toJSON() ?? null,
            finishedAt: audit.finishedAt?.toJSON() ?? null,
            reason: audit.reason,
            endReason,
            note,
            createdAt: now.toJSON(),
            updatedAt: now.toJSON(),
        });
    });
});
