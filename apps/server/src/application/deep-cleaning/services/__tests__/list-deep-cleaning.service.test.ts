import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {DeepCleaningRepository} from '../../../../domain/deep-cleaning/deep-cleaning.repository';
import type {DeepCleaning} from '../../../../domain/deep-cleaning/entities';
import {DeepCleaningEndReasonType} from '../../../../domain/deep-cleaning/entities';
import {fakeDeepCleaning} from '../../../../domain/deep-cleaning/entities/__tests__/fake-deep-cleaning';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListDeepCleaningDto} from '../../dtos';
import {DeepCleaningDto} from '../../dtos';
import {ListDeepCleaningService} from '../list-deep-cleaning.service';

describe('A list-deep-cleaning service', () => {
    const deepCleaningRepository = mock<DeepCleaningRepository>();
    const listDeepCleaningService = new ListDeepCleaningService(deepCleaningRepository);
    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list deep cleanings', async () => {
        const existingDeepCleanings: DeepCleaning[] = [fakeDeepCleaning({companyId}), fakeDeepCleaning({companyId})];

        const paginatedDeepCleanings: PaginatedList<DeepCleaning> = {
            data: existingDeepCleanings,
            totalCount: existingDeepCleanings.length,
            nextCursor: null,
        };

        const payload: ListDeepCleaningDto = {
            companyId,
            pagination: {
                limit: 5,
                sort: {createdAt: 'desc'},
            },
            roomId,
        };

        jest.spyOn(deepCleaningRepository, 'search').mockResolvedValueOnce(paginatedDeepCleanings);

        await expect(listDeepCleaningService.execute({actor, payload})).resolves.toEqual({
            data: existingDeepCleanings.map((cleaning) => new DeepCleaningDto(cleaning)),
            totalCount: existingDeepCleanings.length,
            nextCursor: null,
        });

        expect(existingDeepCleanings.flatMap((deepCleaning) => deepCleaning.events)).toHaveLength(0);

        expect(deepCleaningRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 5,
                sort: {createdAt: 'desc'},
            },
            {
                roomId,
            }
        );
    });

    it('should paginate deep cleanings', async () => {
        const now = new Date();

        const existingDeepCleanings: DeepCleaning[] = [
            fakeDeepCleaning({
                companyId,
                endReason: DeepCleaningEndReasonType.EXPIRED,
                finishedById: UserId.generate(),
                finishedAt: now,
            }),
            fakeDeepCleaning({companyId}),
        ];

        const paginatedDeepCleanings: PaginatedList<DeepCleaning> = {
            data: existingDeepCleanings,
            totalCount: existingDeepCleanings.length,
            nextCursor: null,
        };

        const payload: ListDeepCleaningDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
            endReason: DeepCleaningEndReasonType.EXPIRED,
        };

        jest.spyOn(deepCleaningRepository, 'search').mockResolvedValueOnce(paginatedDeepCleanings);

        await expect(listDeepCleaningService.execute({actor, payload})).resolves.toEqual({
            data: existingDeepCleanings.map((cleaning) => new DeepCleaningDto(cleaning)),
            totalCount: existingDeepCleanings.length,
            nextCursor: null,
        });

        expect(existingDeepCleanings.flatMap((deepCleaning) => deepCleaning.events)).toHaveLength(0);

        expect(deepCleaningRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                endReason: DeepCleaningEndReasonType.EXPIRED,
                endUserId: undefined,
                roomId: undefined,
                startedById: undefined,
            }
        );
    });
});
