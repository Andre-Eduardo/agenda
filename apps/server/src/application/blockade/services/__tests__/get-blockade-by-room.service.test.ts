import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {BlockadeRepository} from '../../../../domain/blockade/blockade.repository';
import {fakeBlockade} from '../../../../domain/blockade/entities/__tests__/fake-blockade';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetBlockadeByRoomDto} from '../../dtos';
import {BlockadeDto} from '../../dtos';
import {GetBlockadeByRoomService} from '../get-blockade-by-room.service';

describe('A get-blockade-by-room service', () => {
    const defectRepository = mock<DefectRepository>();
    const blockadeRepository = mock<BlockadeRepository>();
    const getBlockadeByRoomService = new GetBlockadeByRoomService(blockadeRepository, defectRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();
    const defects = [fakeDefect(), fakeDefect()];

    it('should get a blockade', async () => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: defects,
            totalCount: defects.length,
            nextCursor: null,
        };
        const existingBlockade = fakeBlockade({companyId, defects: defects.map((defect) => defect.id)});
        const payload: GetBlockadeByRoomDto = {
            roomId: existingBlockade.roomId,
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);
        jest.spyOn(blockadeRepository, 'findByRoom').mockResolvedValueOnce(existingBlockade);

        await expect(getBlockadeByRoomService.execute({actor, payload})).resolves.toEqual(
            new BlockadeDto({...existingBlockade, defects})
        );

        expect(defectRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: defects.length,
                sort: {},
            },
            {
                defectIds: [defects[0].id, defects[1].id],
            }
        );
        expect(existingBlockade.events).toHaveLength(0);
        expect(blockadeRepository.findByRoom).toHaveBeenCalledWith(payload.roomId);
    });

    it('should throw an error when the blockade does not exist', async () => {
        const payload: GetBlockadeByRoomDto = {
            roomId: RoomId.generate(),
        };

        jest.spyOn(blockadeRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getBlockadeByRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'No blockade found for the room.'
        );
    });
});
