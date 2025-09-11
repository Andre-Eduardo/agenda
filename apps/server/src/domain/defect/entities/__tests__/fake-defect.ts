import {CompanyId} from '../../../company/entities';
import {DefectTypeId} from '../../../defect-type/entities';
import {RoomId} from '../../../room/entities';
import {UserId} from '../../../user/entities';
import {Defect, DefectId} from '../index';

export function fakeDefect(payload: Partial<Defect> = {}): Defect {
    return new Defect({
        id: DefectId.generate(),
        roomId: RoomId.generate(),
        note: 'Light bulb is broken',
        createdById: UserId.generate(),
        defectTypeId: DefectTypeId.generate(),
        finishedById: null,
        finishedAt: null,
        companyId: CompanyId.generate(),
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
