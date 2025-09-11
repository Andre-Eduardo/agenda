import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {UserId} from '../../../../domain/user/entities';
import type {ListDefectDto} from '../../dtos';
import {DefectDto} from '../../dtos';
import {ListDefectService} from '../list-defect.service';

describe('A list-defect service', () => {
    const defectRepository = mock<DefectRepository>();
    const listDefectService = new ListDefectService(defectRepository);

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const existingDefect = [
        fakeDefect({note: 'defect'}),
        fakeDefect({note: 'defect 2', finishedById: actor.userId, finishedAt: new Date(1000)}),
    ];

    it('should list defects', async () => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: existingDefect,
            totalCount: existingDefect.length,
            nextCursor: null,
        };

        const payload: ListDefectDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {note: 'asc'},
            },
            note: 'defect',
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);

        await expect(listDefectService.execute({actor, payload})).resolves.toEqual({
            data: existingDefect.map((defect) => new DefectDto(defect)),
            totalCount: existingDefect.length,
            nextCursor: null,
        });
        expect(existingDefect.flatMap((defect) => defect.events)).toHaveLength(0);

        expect(defectRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {note: 'asc'},
            },
            {
                note: 'defect',
            }
        );
    });

    it('should paginate defects', async () => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: existingDefect,
            totalCount: existingDefect.length,
            nextCursor: null,
        };

        const payload: ListDefectDto = {
            companyId,
            note: 'defect',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);

        await expect(listDefectService.execute({actor, payload})).resolves.toEqual({
            data: existingDefect.map((defect) => new DefectDto(defect)),
            totalCount: existingDefect.length,
            nextCursor: null,
        });

        expect(existingDefect.flatMap((defect) => defect.events)).toHaveLength(0);

        expect(defectRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                note: 'defect',
            }
        );
    });
});
