import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomCategory, RoomCategoryId} from '../../../../domain/room-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {RoomCategoryDto} from '../../dtos';
import type {
    CreateRoomCategoryService,
    DeleteRoomCategoryService,
    GetRoomCategoryService,
    UpdateRoomCategoryService,
    ListRoomCategoryService,
} from '../../services';
import {RoomCategoryController} from '../room-category.controller';

describe('A room category controller', () => {
    const createCategoryServiceMock = mock<CreateRoomCategoryService>();
    const deleteCategoryServiceMock = mock<DeleteRoomCategoryService>();
    const getCategoryServiceMock = mock<GetRoomCategoryService>();
    const listCategoryServiceMock = mock<ListRoomCategoryService>();
    const updateCategoryServiceMock = mock<UpdateRoomCategoryService>();
    const roomCategoryController = new RoomCategoryController(
        createCategoryServiceMock,
        deleteCategoryServiceMock,
        getCategoryServiceMock,
        listCategoryServiceMock,
        updateCategoryServiceMock
    );

    const companyId = CompanyId.generate();
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a room category', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                name: 'ACQUA MARINE',
                acronym: 'AM',
                guestCount: 2,
            };

            const expectedCategory = new RoomCategoryDto(RoomCategory.create(payload));

            jest.spyOn(createCategoryServiceMock, 'execute').mockResolvedValueOnce(expectedCategory);

            await expect(roomCategoryController.createCategory(actor, payload)).resolves.toEqual(expectedCategory);

            expect(createCategoryServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when deleting a room category', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = RoomCategoryId.generate();

            await roomCategoryController.deleteCategory(actor, id);

            expect(deleteCategoryServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });

    describe('when getting a room category', () => {
        it('should repass the responsibility to the right service', async () => {
            const roomCategory = RoomCategory.create({
                companyId,
                name: 'HIGH TECH',
                acronym: 'HT',
                guestCount: 2,
            });

            const expectedCategory = new RoomCategoryDto(roomCategory);

            jest.spyOn(getCategoryServiceMock, 'execute').mockResolvedValueOnce(expectedCategory);

            await expect(roomCategoryController.getCategory(actor, roomCategory.id)).resolves.toEqual(expectedCategory);

            expect(getCategoryServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: roomCategory.id}});
        });
    });

    describe('when listing room categories', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                name: 'HIGH TECH',
                companyId,
                acronym: 'HT',
                guestCount: 1,
                pagination: {
                    limit: 10,
                },
            };
            const categories = [
                RoomCategory.create({companyId, name: 'HIGH TECH', acronym: 'HT', guestCount: 2}),
                RoomCategory.create({companyId, name: 'NOVA INDIA', acronym: 'NI', guestCount: 2}),
            ];
            const expectedResult: PaginatedDto<RoomCategoryDto> = {
                data: categories.map((roomCategory) => new RoomCategoryDto(roomCategory)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listCategoryServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(roomCategoryController.listCategory(actor, payload)).resolves.toEqual(expectedResult);

            expect(listCategoryServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when updating a room category', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingCategory = RoomCategory.create({
                companyId,
                name: 'HIGH TECH',
                acronym: 'HT',
                guestCount: 2,
            });
            const payload = {
                name: 'SUITE BELLE',
                acronym: 'SB',
                guestCount: 3,
            };

            const expectedCategory = new RoomCategoryDto(existingCategory);

            jest.spyOn(updateCategoryServiceMock, 'execute').mockResolvedValueOnce(expectedCategory);

            await expect(roomCategoryController.updateCategory(actor, existingCategory.id, payload)).resolves.toEqual(
                expectedCategory
            );

            expect(updateCategoryServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingCategory.id, ...payload},
            });
        });
    });
});
