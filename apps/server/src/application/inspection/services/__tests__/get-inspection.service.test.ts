import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {fakeInspection} from '../../../../domain/inspection/entities/__tests__/fake-inspection';
import type {InspectionRepository} from '../../../../domain/inspection/inspection.repository';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetInspectionDto} from '../../dtos';
import {InspectionDto} from '../../dtos';
import {GetInspectionService} from '../get-inspection.service';

describe('A get-inspection service', () => {
    const inspectionRepository = mock<InspectionRepository>();
    const getInspectionService = new GetInspectionService(inspectionRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get an inspection', async () => {
        const existingInspection = fakeInspection();

        const payload: GetInspectionDto = {
            id: existingInspection.id,
        };

        jest.spyOn(inspectionRepository, 'findById').mockResolvedValueOnce(existingInspection);

        await expect(
            getInspectionService.execute({
                actor,
                payload,
            })
        ).resolves.toEqual(new InspectionDto(existingInspection));

        expect(existingInspection.events).toHaveLength(0);

        expect(inspectionRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the inspection does not exist', async () => {
        const payload: GetInspectionDto = {
            id: RoomStatusId.generate(),
        };

        jest.spyOn(inspectionRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getInspectionService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Inspection not found'
        );
    });
});
