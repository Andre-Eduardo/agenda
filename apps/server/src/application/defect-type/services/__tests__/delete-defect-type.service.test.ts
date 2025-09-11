import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DefectTypeRepository} from '../../../../domain/defect-type/defect-type.repository';
import {DefectTypeId} from '../../../../domain/defect-type/entities';
import {fakeDefectType} from '../../../../domain/defect-type/entities/__tests__/fake-defect-type';
import {DefectTypeDeletedEvent} from '../../../../domain/defect-type/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteDefectTypeDto} from '../../dtos';
import {DeleteDefectTypeService} from '../delete-defect-type.service';

describe('A delete-defect-type service', () => {
    const defectTypeRepository = mock<DefectTypeRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteDefectTypeService = new DeleteDefectTypeService(defectTypeRepository, eventDispatcher);

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

    it('should delete a defect type', async () => {
        const existingDefectType = fakeDefectType();

        const payload: DeleteDefectTypeDto = {
            id: existingDefectType.id,
        };

        jest.spyOn(defectTypeRepository, 'findById').mockResolvedValueOnce(existingDefectType);

        await deleteDefectTypeService.execute({actor, payload});

        expect(existingDefectType.events).toHaveLength(1);
        expect(existingDefectType.events[0]).toBeInstanceOf(DefectTypeDeletedEvent);
        expect(existingDefectType.events).toEqual([
            {
                type: DefectTypeDeletedEvent.type,
                defectType: existingDefectType,
                companyId: existingDefectType.companyId,
                timestamp: now,
            },
        ]);
        expect(defectTypeRepository.delete).toHaveBeenCalledWith(existingDefectType.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingDefectType);
    });

    it('should throw an error when the defect type does not exist', async () => {
        const payload: DeleteDefectTypeDto = {
            id: DefectTypeId.generate(),
        };

        jest.spyOn(defectTypeRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteDefectTypeService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Defect type not found'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
