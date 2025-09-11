import {CompanyId} from '../../../company/entities';
import {DefectId} from '../../../defect/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {Maintenance} from '../maintenance.entity';

export function fakeMaintenance(payload: Partial<Maintenance> = {}): Maintenance {
    return new Maintenance({
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
