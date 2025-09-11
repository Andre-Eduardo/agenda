import {CompanyId} from '../../../company/entities';
import {DefectType, DefectTypeId} from '../index';

export function fakeDefectType(payload: Partial<DefectType> = {}): DefectType {
    return new DefectType({
        id: DefectTypeId.generate(),
        companyId: CompanyId.generate(),
        name: 'Broken',
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
