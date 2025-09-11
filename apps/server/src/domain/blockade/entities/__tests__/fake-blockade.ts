import {CompanyId} from '../../../company/entities';
import {DefectId} from '../../../defect/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {Blockade} from '../blockade.entity';

export function fakeBlockade(payload: Partial<Blockade> = {}): Blockade {
    return new Blockade({
        id: RoomStatusId.generate(),
        companyId: CompanyId.generate(),
        note: 'note',
        defects: [DefectId.generate()],
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
