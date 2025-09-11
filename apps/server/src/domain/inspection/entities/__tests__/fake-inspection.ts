import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {Inspection} from '../index';

export function fakeInspection(payload: Partial<Inspection> = {}): Inspection {
    return new Inspection({
        id: RoomStatusId.generate(),
        companyId: CompanyId.generate(),
        roomId: RoomId.generate(),
        startedById: UserId.generate(),
        startedAt: new Date(1000),
        finishedById: null,
        finishedAt: null,
        endReason: null,
        note: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
