import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {CleaningStartedEvent, CleaningFinishedEvent} from '../../events';
import type {StartCleaning} from '../cleaning.entity';
import {Cleaning, CleaningEndReasonType} from '../cleaning.entity';
import {fakeCleaning} from './fake-cleaning';

describe('A cleaning', () => {
    const now = new Date(1000);
    const companyId = CompanyId.generate();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on start', () => {
        it('should emit a cleaning-started event', () => {
            const roomId = RoomId.generate();
            const startedById = UserId.generate();

            const data: StartCleaning = {
                companyId,
                roomId,
                startedById,
            };

            const cleaning = Cleaning.start(data);

            expect(cleaning.id).toBeInstanceOf(RoomStatusId);
            expect(cleaning.companyId).toBeInstanceOf(CompanyId);
            expect(cleaning.roomId).toBeInstanceOf(RoomId);
            expect(cleaning.startedById).toBeInstanceOf(UserId);
            expect(cleaning.startedById).toBe(startedById);
            expect(cleaning.startedAt).toEqual(now);
            expect(cleaning.finishedById).toBeNull();
            expect(cleaning.finishedAt).toBeNull();
            expect(cleaning.endReason).toBeNull();

            expect(cleaning.events).toEqual([
                {
                    type: CleaningStartedEvent.type,
                    companyId,
                    cleaning,
                    timestamp: now,
                },
            ]);

            expect(cleaning.events[0]).toBeInstanceOf(CleaningStartedEvent);
        });
    });

    describe('on finish', () => {
        it.each<CleaningEndReasonType.FINISHED | CleaningEndReasonType.CANCELED>([
            CleaningEndReasonType.FINISHED,
            CleaningEndReasonType.CANCELED,
        ])('should emit a cleaning-finished event', (endReason) => {
            const finishedById = UserId.generate();

            const cleaning = fakeCleaning({companyId});

            cleaning.finish({
                finishedById,
                endReason,
            });

            expect(cleaning.finishedById).toBe(finishedById);
            expect(cleaning.endReason).toBe(endReason);
            expect(cleaning.finishedAt).toEqual(now);

            expect(cleaning.events).toEqual([
                {
                    type: CleaningFinishedEvent.type,
                    companyId,
                    endReason,
                    cleaningId: cleaning.id,
                    finishedById: cleaning.finishedById,
                    timestamp: now,
                },
            ]);

            expect(cleaning.events[0]).toBeInstanceOf(CleaningFinishedEvent);
        });

        it('should emit a cleaning-finished event when expired', () => {
            const cleaning = fakeCleaning({companyId});

            cleaning.finish({
                endReason: CleaningEndReasonType.EXPIRED,
            });

            expect(cleaning.finishedById).toBe(cleaning.startedById);
            expect(cleaning.endReason).toBe(CleaningEndReasonType.EXPIRED);
            expect(cleaning.finishedAt).toEqual(now);

            expect(cleaning.events).toEqual([
                {
                    type: CleaningFinishedEvent.type,
                    companyId,
                    endReason: CleaningEndReasonType.EXPIRED,
                    cleaningId: cleaning.id,
                    finishedById: cleaning.finishedById,
                    timestamp: now,
                },
            ]);

            expect(cleaning.events[0]).toBeInstanceOf(CleaningFinishedEvent);
        });
    });

    it.each([
        {
            finishedById: null,
            finishedAt: null,
            endReason: null,
        },
        {
            finishedById: UserId.generate(),
            finishedAt: new Date(1000),
            endReason: CleaningEndReasonType.CANCELED,
        },
    ])('should be serializable', (values) => {
        const cleaning = fakeCleaning({...values});

        expect(cleaning.toJSON()).toEqual({
            id: cleaning.id.toJSON(),
            companyId: cleaning.companyId.toJSON(),
            roomId: cleaning.roomId.toJSON(),
            startedById: cleaning.startedById.toJSON(),
            startedAt: cleaning.startedAt.toJSON(),
            finishedById: cleaning.finishedById?.toJSON() ?? null,
            finishedAt: cleaning.finishedAt?.toJSON() ?? null,
            endReason: cleaning.endReason ?? null,
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });
});
