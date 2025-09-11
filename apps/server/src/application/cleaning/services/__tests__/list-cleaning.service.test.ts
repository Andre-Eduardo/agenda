import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {CleaningRepository} from '../../../../domain/cleaning/cleaning.repository';
import type {Cleaning} from '../../../../domain/cleaning/entities';
import {CleaningEndReasonType} from '../../../../domain/cleaning/entities';
import {fakeCleaning} from '../../../../domain/cleaning/entities/__tests__/fake-cleaning';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListCleaningDto} from '../../dtos';
import {CleaningDto} from '../../dtos/cleaning.dto';
import {ListCleaningService} from '../list-cleaning.service';

describe('A list-cleaning service', () => {
    const cleaningRepository = mock<CleaningRepository>();
    const listCleaningService = new ListCleaningService(cleaningRepository);
    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list cleanings', async () => {
        const existingCleanings: Cleaning[] = [fakeCleaning({companyId}), fakeCleaning({companyId})];

        const paginatedCleanings: PaginatedList<Cleaning> = {
            data: existingCleanings,
            totalCount: existingCleanings.length,
            nextCursor: null,
        };

        const payload: ListCleaningDto = {
            companyId,
            pagination: {
                limit: 5,
                sort: {createdAt: 'desc'},
            },
            roomId,
        };

        jest.spyOn(cleaningRepository, 'search').mockResolvedValueOnce(paginatedCleanings);

        await expect(listCleaningService.execute({actor, payload})).resolves.toEqual({
            data: existingCleanings.map((cleaning) => new CleaningDto(cleaning)),
            totalCount: existingCleanings.length,
            nextCursor: null,
        });

        expect(existingCleanings.flatMap((cleaning) => cleaning.events)).toHaveLength(0);

        expect(cleaningRepository.search).toHaveBeenCalledWith(
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

    it('should paginate cleanings', async () => {
        const now = new Date();

        const existingCleanings: Cleaning[] = [
            fakeCleaning({
                companyId,
                endReason: CleaningEndReasonType.EXPIRED,
                finishedById: UserId.generate(),
                finishedAt: now,
            }),
            fakeCleaning({companyId}),
        ];

        const paginatedCleanings: PaginatedList<Cleaning> = {
            data: existingCleanings,
            totalCount: existingCleanings.length,
            nextCursor: null,
        };

        const payload: ListCleaningDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
            endReason: CleaningEndReasonType.EXPIRED,
        };

        jest.spyOn(cleaningRepository, 'search').mockResolvedValueOnce(paginatedCleanings);

        await expect(listCleaningService.execute({actor, payload})).resolves.toEqual({
            data: existingCleanings.map((cleaning) => new CleaningDto(cleaning)),
            totalCount: existingCleanings.length,
            nextCursor: null,
        });

        expect(existingCleanings.flatMap((cleaning) => cleaning.events)).toHaveLength(0);

        expect(cleaningRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                endReason: CleaningEndReasonType.EXPIRED,
                finishedById: undefined,
                roomId: undefined,
                startedById: undefined,
            }
        );
    });
});
