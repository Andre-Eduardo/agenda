import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectTypeRepository} from '../../../../domain/defect-type/defect-type.repository';
import type {DefectType} from '../../../../domain/defect-type/entities';
import {fakeDefectType} from '../../../../domain/defect-type/entities/__tests__/fake-defect-type';
import {UserId} from '../../../../domain/user/entities';
import type {ListDefectTypeDto} from '../../dtos';
import {DefectTypeDto} from '../../dtos';
import {ListDefectTypeService} from '../list-defect-type.service';

describe('A list-defect-type service', () => {
    const defectTypeRepository = mock<DefectTypeRepository>();
    const listDefectTypeService = new ListDefectTypeService(defectTypeRepository);

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list defect types', async () => {
        const existingDefectTypes = [
            fakeDefectType({
                companyId,
                name: 'Defect type 1',
            }),
            fakeDefectType({
                companyId,
                name: 'Defect type 2',
            }),
        ];

        const paginatedDefectType: PaginatedList<DefectType> = {
            data: existingDefectTypes,
            totalCount: existingDefectTypes.length,
            nextCursor: null,
        };

        const payload: ListDefectTypeDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
            name: 'Defect',
        };

        jest.spyOn(defectTypeRepository, 'search').mockResolvedValueOnce(paginatedDefectType);

        await expect(listDefectTypeService.execute({actor, payload})).resolves.toEqual({
            data: existingDefectTypes.map((defectType) => new DefectTypeDto(defectType)),
            totalCount: existingDefectTypes.length,
            nextCursor: null,
        });
        expect(existingDefectTypes.flatMap((defectType) => defectType.events)).toHaveLength(0);

        expect(defectTypeRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'Defect',
            }
        );
    });

    it('should paginate defect types', async () => {
        const existingDefectTypes = [
            fakeDefectType({
                companyId,
                name: 'Defect type 1',
            }),
            fakeDefectType({
                companyId,
                name: 'Defect type 2',
            }),
        ];

        const paginatedDefectType: PaginatedList<DefectType> = {
            data: existingDefectTypes,
            totalCount: existingDefectTypes.length,
            nextCursor: null,
        };

        const payload: ListDefectTypeDto = {
            companyId,
            name: 'Defect',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 1,
            },
        };

        jest.spyOn(defectTypeRepository, 'search').mockResolvedValueOnce(paginatedDefectType);

        await expect(listDefectTypeService.execute({actor, payload})).resolves.toEqual({
            data: existingDefectTypes.map((defectType) => new DefectTypeDto(defectType)),
            totalCount: existingDefectTypes.length,
            nextCursor: null,
        });

        expect(existingDefectTypes.flatMap((defectType) => defectType.events)).toHaveLength(0);

        expect(defectTypeRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 1,
                sort: {},
            },
            {
                name: 'Defect',
            }
        );
    });
});
