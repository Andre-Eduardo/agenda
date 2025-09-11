import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {RoomCategory} from '../../../../domain/room-category/entities';
import {fakeRoomCategory} from '../../../../domain/room-category/entities/__tests__/fake-room-category';
import type {RoomCategoryRepository} from '../../../../domain/room-category/room-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListRoomCategoryDto} from '../../dtos';
import {RoomCategoryDto} from '../../dtos';
import {ListRoomCategoryService} from '../list-room-category.service';

describe('A list-room-category service', () => {
    const roomCategoryRepository = mock<RoomCategoryRepository>();
    const listRoomCategoryService = new ListRoomCategoryService(roomCategoryRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    const existingCategories: RoomCategory[] = [
        fakeRoomCategory({
            companyId,
            name: 'POP LUSH',
            acronym: 'PL',
            guestCount: 1,
        }),
        fakeRoomCategory({
            companyId,
            name: 'POP BELLE',
            acronym: 'PB',
            guestCount: 2,
        }),
        fakeRoomCategory({
            companyId,
            name: 'POP DANCE',
            acronym: 'PD',
            guestCount: 3,
        }),
    ];

    it('should list room categories', async () => {
        const paginatedCategories: PaginatedList<RoomCategory> = {
            data: existingCategories,
            totalCount: existingCategories.length,
            nextCursor: null,
        };

        const payload: ListRoomCategoryDto = {
            companyId,
            pagination: {
                limit: 3,
                sort: {name: 'asc'},
            },
            name: 'POP',
        };

        jest.spyOn(roomCategoryRepository, 'search').mockResolvedValueOnce(paginatedCategories);

        await expect(listRoomCategoryService.execute({actor, payload})).resolves.toEqual({
            data: existingCategories.map((roomCategory) => new RoomCategoryDto(roomCategory)),
            totalCount: existingCategories.length,
            nextCursor: null,
        });

        expect(existingCategories.flatMap((roomCategory) => roomCategory.events)).toHaveLength(0);

        expect(roomCategoryRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 3,
                sort: {name: 'asc'},
            },
            {
                name: 'POP',
            }
        );
    });

    it('should paginate room categories', async () => {
        const paginatedCategories: PaginatedList<RoomCategory> = {
            data: existingCategories,
            totalCount: existingCategories.length,
            nextCursor: null,
        };

        const payload: ListRoomCategoryDto = {
            companyId,
            name: 'POP',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
            },
        };

        jest.spyOn(roomCategoryRepository, 'search').mockResolvedValueOnce(paginatedCategories);

        await expect(listRoomCategoryService.execute({actor, payload})).resolves.toEqual({
            data: existingCategories.map((roomCategory) => new RoomCategoryDto(roomCategory)),
            totalCount: existingCategories.length,
            nextCursor: null,
        });

        expect(existingCategories.flatMap((roomCategory) => roomCategory.events)).toHaveLength(0);

        expect(roomCategoryRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
                sort: {},
            },
            {
                name: 'POP',
            }
        );
    });
});
