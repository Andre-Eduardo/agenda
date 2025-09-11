import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {DeepCleaning} from '../deep-cleaning.entity';

export function fakeDeepCleaning(payload: Partial<DeepCleaning> = {}): DeepCleaning {
    return new DeepCleaning({
        id: RoomStatusId.generate(),
        companyId: CompanyId.generate(),
        roomId: RoomId.generate(),
        startedById: UserId.generate(),
        startedAt: new Date(1000),
        finishedById: null,
        finishedAt: null,
        endReason: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
