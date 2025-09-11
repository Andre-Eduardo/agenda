import {CompanyId} from '../../../company/entities';
import {RoomCategoryId} from '../../../room-category/entities';
import {RoomState} from '../../models/room-state';
import {Room, RoomId} from '../index';

export function fakeRoom(payload: Partial<Room> = {}): Room {
    return new Room({
        id: RoomId.generate(),
        companyId: CompanyId.generate(),
        categoryId: RoomCategoryId.generate(),
        name: 'Suite 101',
        number: 101,
        state: RoomState.VACANT,
        stateSnapshot: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
