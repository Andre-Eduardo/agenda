import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {UserId} from '../../../user/entities';
import {RoomStatus, RoomStatusId} from '../room-status.entity';

export function fakeRoomStatus(payload: Partial<RoomStatus> = {}): RoomStatus {
    return new RoomStatus({
        id: RoomStatusId.generate(),
        companyId: CompanyId.generate(),
        roomId: RoomId.generate(),
        startedById: UserId.generate(),
        startedAt: new Date(1000),
        finishedById: null,
        finishedAt: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
