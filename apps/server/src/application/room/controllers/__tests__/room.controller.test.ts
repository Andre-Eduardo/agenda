import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {Room, RoomId} from '../../../../domain/room/entities';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {RoomDto} from '../../dtos';
import type {
    CreateRoomService,
    DeleteRoomService,
    GetRoomService,
    ListRoomService,
    UpdateRoomService,
} from '../../services';
import {RoomController} from '../index';

describe('A room controller', () => {
    const createRoomServiceMock = mock<CreateRoomService>();
    const getRoomServiceMock = mock<GetRoomService>();
    const listRoomServiceMock = mock<ListRoomService>();
    const updateRoomServiceMock = mock<UpdateRoomService>();
    const deleteRoomServiceMock = mock<DeleteRoomService>();
    const roomController = new RoomController(
        createRoomServiceMock,
        getRoomServiceMock,
        listRoomServiceMock,
        updateRoomServiceMock,
        deleteRoomServiceMock
    );

    const companyId = CompanyId.generate();
    const categoryId = RoomCategoryId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a room', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                categoryId,
                number: 101,
            };

            const expectedRoom = new RoomDto(Room.create(payload));

            jest.spyOn(createRoomServiceMock, 'execute').mockResolvedValueOnce(expectedRoom);

            await expect(roomController.createRoom(actor, payload)).resolves.toEqual(expectedRoom);

            expect(createRoomServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getRoomServiceMock.execute).not.toHaveBeenCalled();
            expect(listRoomServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteRoomServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting a room', () => {
        it('should repass the responsibility to the right service', async () => {
            const room = Room.create({
                companyId,
                categoryId,
                number: 101,
                name: 'Suite 101',
            });

            const expectedRoom = new RoomDto(room);

            jest.spyOn(getRoomServiceMock, 'execute').mockResolvedValue(expectedRoom);

            await expect(roomController.getRoom(actor, room.id)).resolves.toEqual(expectedRoom);

            expect(getRoomServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: room.id}});
        });
    });

    describe('when listing rooms', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                number: 101,
                companyId,
                pagination: {
                    limit: 2,
                },
            };

            const rooms = [
                Room.create({
                    companyId,
                    categoryId,
                    number: 101,
                    name: 'Suite 101',
                }),
                Room.create({
                    companyId,
                    categoryId,
                    number: 102,
                    name: 'Suite 102',
                }),
            ];

            const expectedRoom: PaginatedDto<RoomDto> = {
                data: rooms.map((rooma) => new RoomDto(rooma)),
                totalCount: 2,
                nextCursor: 'nextCursor',
            };

            jest.spyOn(listRoomServiceMock, 'execute').mockResolvedValue(expectedRoom);

            await expect(roomController.listRoom(actor, payload)).resolves.toEqual(expectedRoom);

            expect(listRoomServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when updating a room', () => {
        it('should repass the responsibility to the right service', async () => {
            const room = Room.create({
                companyId,
                categoryId,
                number: 101,
                name: 'Suite 101',
            });

            const payload = {
                name: 'Suite 102',
            };

            const existingRoom = new RoomDto(room);

            jest.spyOn(updateRoomServiceMock, 'execute').mockResolvedValueOnce(existingRoom);

            await expect(roomController.updateRoom(actor, room.id, payload)).resolves.toEqual(existingRoom);

            expect(updateRoomServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: room.id, ...payload},
            });
        });
    });

    describe('when deleting a room', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = RoomId.generate();

            await roomController.deleteRoom(actor, id);

            expect(deleteRoomServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
