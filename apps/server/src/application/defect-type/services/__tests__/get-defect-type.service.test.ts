import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DefectTypeRepository} from '../../../../domain/defect-type/defect-type.repository';
import {DefectTypeId} from '../../../../domain/defect-type/entities';
import {fakeDefectType} from '../../../../domain/defect-type/entities/__tests__/fake-defect-type';
import {UserId} from '../../../../domain/user/entities';
import type {GetDefectTypeDto} from '../../dtos';
import {DefectTypeDto} from '../../dtos';
import {GetDefectTypeService} from '../get-defect-type.service';

describe('A get-defect-type service', () => {
    const defectTypeRepository = mock<DefectTypeRepository>();
    const getDefectTypeService = new GetDefectTypeService(defectTypeRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a defect type', async () => {
        const existingDefectType = fakeDefectType();

        const payload: GetDefectTypeDto = {
            id: existingDefectType.id,
        };

        jest.spyOn(defectTypeRepository, 'findById').mockResolvedValueOnce(existingDefectType);

        await expect(getDefectTypeService.execute({actor, payload})).resolves.toEqual(
            new DefectTypeDto(existingDefectType)
        );

        expect(existingDefectType.events).toHaveLength(0);

        expect(defectTypeRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the defect type does not exist', async () => {
        const payload: GetDefectTypeDto = {
            id: DefectTypeId.generate(),
        };

        jest.spyOn(defectTypeRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getDefectTypeService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Defect type not found'
        );
    });
});
