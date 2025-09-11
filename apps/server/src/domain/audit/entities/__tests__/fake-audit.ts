import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {Audit} from '../audit.entity';

export function fakeAudit(payload: Partial<Audit> = {}): Audit {
    return new Audit({
        id: RoomStatusId.generate(),
        companyId: CompanyId.generate(),
        roomId: RoomId.generate(),
        startedById: UserId.generate(),
        startedAt: new Date(),
        finishedById: null,
        finishedAt: null,
        reason: 'Check room conditions',
        endReason: null,
        note: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...payload,
    });
}
