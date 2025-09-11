import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {Cleaning} from '../cleaning.entity';

export function fakeCleaning(payload: Partial<Cleaning> = {}): Cleaning {
    return new Cleaning({
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
