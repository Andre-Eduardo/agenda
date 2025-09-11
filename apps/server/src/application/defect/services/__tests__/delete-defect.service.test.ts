import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import {DefectId} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {DefectDeletedEvent} from '../../../../domain/defect/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteDefectDto} from '../../dtos';
import {DeleteDefectService} from '../delete-defect.service';

describe('A delete-defect service', () => {
    const defectRepository = mock<DefectRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteDefectService = new DeleteDefectService(defectRepository, eventDispatcher);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should delete a defect', async () => {
        const existingDefect = fakeDefect();

        const payload: DeleteDefectDto = {
            id: existingDefect.id,
        };

        jest.spyOn(defectRepository, 'findById').mockResolvedValueOnce(existingDefect);

        await deleteDefectService.execute({actor, payload});

        expect(existingDefect.events).toHaveLength(1);
        expect(existingDefect.events[0]).toBeInstanceOf(DefectDeletedEvent);
        expect(existingDefect.events).toEqual([
            {
                type: DefectDeletedEvent.type,
                defect: existingDefect,
                companyId: existingDefect.companyId,
                timestamp: now,
            },
        ]);
        expect(defectRepository.delete).toHaveBeenCalledWith(existingDefect.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingDefect);
    });

    it('should throw an error when the defect does not exist', async () => {
        const payload: DeleteDefectDto = {
            id: DefectId.generate(),
        };

        jest.spyOn(defectRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteDefectService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Defect not found'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
