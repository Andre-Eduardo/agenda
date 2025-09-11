import {CompanyId} from '../../../company/entities';
import {RoomCategory, RoomCategoryId} from '../room-category.entity';

export function fakeRoomCategory(payload: Partial<RoomCategory> = {}): RoomCategory {
    return new RoomCategory({
        id: RoomCategoryId.generate(),
        companyId: CompanyId.generate(),
        name: 'Standard',
        acronym: 'ST',
        guestCount: 2,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
