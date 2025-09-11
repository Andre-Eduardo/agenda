import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {fakeInspection} from '../../../../domain/inspection/entities/__tests__/fake-inspection';
import type {InspectionRepository} from '../../../../domain/inspection/inspection.repository';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetInspectionByRoomDto} from '../../dtos';
import {InspectionDto} from '../../dtos';
import {GetInspectionByRoomService} from '../get-inspection-by-room.service';

describe('A get-inspection-by-room service', () => {
    const inspectionRepository = mock<InspectionRepository>();
    const getInspectionService = new GetInspectionByRoomService(inspectionRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get an inspection', async () => {
        const existingInspection = fakeInspection();

        const payload: GetInspectionByRoomDto = {
            id: existingInspection.roomId,
        };

        jest.spyOn(inspectionRepository, 'findByRoom').mockResolvedValueOnce(existingInspection);

        await expect(
            getInspectionService.execute({
                actor,
                payload,
            })
        ).resolves.toEqual(new InspectionDto(existingInspection));

        expect(existingInspection.events).toHaveLength(0);

        expect(inspectionRepository.findByRoom).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the inspection does not exist', async () => {
        const payload: GetInspectionByRoomDto = {
            id: RoomId.generate(),
        };

        jest.spyOn(inspectionRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(getInspectionService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Inspection not found for the room'
        );
    });
});
