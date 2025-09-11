import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {UserId} from '../../../user/entities';
import {DeepCleaningStartedEvent, DeepCleaningFinishedEvent} from '../../events';
import type {StartDeepCleaning, FinishDeepCleaning} from '../deep-cleaning.entity';
import {DeepCleaningEndReasonType, DeepCleaning} from '../deep-cleaning.entity';
import {fakeDeepCleaning} from './fake-deep-cleaning';

describe('A deep cleaning', () => {
    const companyId = CompanyId.generate();

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on start', () => {
        it('should emit a deep-cleaning-started event', () => {
            const roomId = RoomId.generate();
            const startedById = UserId.generate();

            const payload: StartDeepCleaning = {
                companyId,
                roomId,
                startedById,
            };

            const deepCleaning = DeepCleaning.start(payload);

            expect(deepCleaning.events).toEqual([
                {
                    companyId,
                    deepCleaning,
                    timestamp: now,
                    type: DeepCleaningStartedEvent.type,
                },
            ]);

            expect(deepCleaning.events[0]).toBeInstanceOf(DeepCleaningStartedEvent);
        });
    });

    describe('on finish', () => {
        it.each<DeepCleaningEndReasonType.FINISHED | DeepCleaningEndReasonType.CANCELED>([
            DeepCleaningEndReasonType.FINISHED,
            DeepCleaningEndReasonType.CANCELED,
        ])('should emit a deep-cleaning-finished event', (endReason) => {
            const finishedById = UserId.generate();

            const payload: FinishDeepCleaning = {
                finishedById,
                endReason,
            };

            const deepCleaning = fakeDeepCleaning({companyId});

            deepCleaning.finish(payload);

            expect(deepCleaning.events).toEqual([
                {
                    companyId,
                    deepCleaningId: deepCleaning.id,
                    finishedById,
                    endReason,
                    timestamp: now,
                    type: DeepCleaningFinishedEvent.type,
                },
            ]);

            expect(deepCleaning.events[0]).toBeInstanceOf(DeepCleaningFinishedEvent);
        });

        it('should emit a deep-cleaning-finished event when expired', () => {
            const deepCleaning = fakeDeepCleaning({companyId});

            deepCleaning.finish({
                endReason: DeepCleaningEndReasonType.EXPIRED,
            });

            expect(deepCleaning.finishedById).toBe(deepCleaning.startedById);
            expect(deepCleaning.endReason).toBe(DeepCleaningEndReasonType.EXPIRED);
            expect(deepCleaning.finishedAt).toEqual(now);

            expect(deepCleaning.events).toEqual([
                {
                    type: DeepCleaningFinishedEvent.type,
                    companyId,
                    endReason: DeepCleaningEndReasonType.EXPIRED,
                    deepCleaningId: deepCleaning.id,
                    finishedById: deepCleaning.finishedById,
                    timestamp: now,
                },
            ]);

            expect(deepCleaning.events[0]).toBeInstanceOf(DeepCleaningFinishedEvent);
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
                endReason: DeepCleaningEndReasonType.CANCELED,
            },
            {
                finishedById: UserId.generate(),
                finishedAt: new Date(1000),
                endReason: DeepCleaningEndReasonType.FINISHED,
            },
        ])('should be serializable', (values) => {
            const deepCleaning = fakeDeepCleaning({...values});

            expect(deepCleaning.toJSON()).toEqual({
                id: deepCleaning.id.toJSON(),
                companyId: deepCleaning.companyId.toJSON(),
                roomId: deepCleaning.roomId.toJSON(),
                startedById: deepCleaning.startedById.toJSON(),
                startedAt: deepCleaning.startedAt.toJSON(),
                finishedById: deepCleaning.finishedById?.toJSON() ?? null,
                finishedAt: deepCleaning.finishedAt?.toJSON() ?? null,
                endReason: deepCleaning.endReason ?? null,
                createdAt: new Date(1000).toJSON(),
                updatedAt: new Date(1000).toJSON(),
            });
        });
    });
});
