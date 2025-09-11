import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {BlockadeRepository} from '../../../../domain/blockade/blockade.repository';
import type {Blockade} from '../../../../domain/blockade/entities';
import {fakeBlockade} from '../../../../domain/blockade/entities/__tests__/fake-blockade';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListBlockadeDto} from '../../dtos';
import {BlockadeDto} from '../../dtos';
import {ListBlockadeService} from '../list-blockade.service';

describe('A list-blockade service', () => {
    const defectRepository = mock<DefectRepository>();
    const blockadeRepository = mock<BlockadeRepository>();
    const listBlockadeService = new ListBlockadeService(blockadeRepository, defectRepository);

    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();
    const defects = [fakeDefect(), fakeDefect()];

    const paginatedDefects: Array<PaginatedList<Defect>> = [
        {
            data: [defects[0]],
            totalCount: 1,
            nextCursor: null,
        },
        {
            data: [defects[1]],
            totalCount: 1,
            nextCursor: null,
        },
    ];

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list blockades', async () => {
        const existingBlockades: Blockade[] = [
            fakeBlockade({companyId, defects: [defects[0].id]}),
            fakeBlockade({companyId, defects: [defects[1].id]}),
        ];

        const paginatedBlockades: PaginatedList<Blockade> = {
            data: existingBlockades,
            totalCount: existingBlockades.length,
            nextCursor: null,
        };

        const payload: ListBlockadeDto = {
            companyId,
            pagination: {
                limit: 5,
                sort: {createdAt: 'desc'},
            },
            roomId,
        };

        jest.spyOn(defectRepository, 'search')
            .mockResolvedValueOnce(paginatedDefects[0])
            .mockResolvedValueOnce(paginatedDefects[1]);
        jest.spyOn(blockadeRepository, 'search').mockResolvedValueOnce(paginatedBlockades);

        await expect(listBlockadeService.execute({actor, payload})).resolves.toEqual({
            data: existingBlockades.map(
                (blockade, index) =>
                    new BlockadeDto({
                        ...blockade,
                        defects: [defects[index]],
                    })
            ),
            totalCount: existingBlockades.length,
            nextCursor: null,
        });

        expect(existingBlockades.flatMap((blockade) => blockade.events)).toHaveLength(0);

        expect(blockadeRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 5,
                sort: {createdAt: 'desc'},
            },
            {
                roomId,
            }
        );
    });

    it('should paginate blockades', async () => {
        const existingBlockades: Blockade[] = [
            fakeBlockade({companyId, defects: [defects[0].id]}),
            fakeBlockade({companyId, defects: [defects[1].id]}),
        ];

        const paginatedBlockades: PaginatedList<Blockade> = {
            data: [existingBlockades[0]],
            totalCount: existingBlockades.length,
            nextCursor: existingBlockades[1].id.toString(),
        };

        const payload: ListBlockadeDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 1,
            },
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects[0]);
        jest.spyOn(blockadeRepository, 'search').mockResolvedValueOnce(paginatedBlockades);

        await expect(listBlockadeService.execute({actor, payload})).resolves.toEqual({
            data: [
                new BlockadeDto({
                    ...existingBlockades[0],
                    defects: [defects[0]],
                }),
            ],
            totalCount: existingBlockades.length,
            nextCursor: existingBlockades[1].id.toString(),
        });

        expect(existingBlockades.flatMap((blockade) => blockade.events)).toHaveLength(0);

        expect(blockadeRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 1,
                sort: {},
            },
            {}
        );
    });
});
