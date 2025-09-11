import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import {DefectId} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {UserId} from '../../../../domain/user/entities';
import type {GetDefectDto} from '../../dtos';
import {DefectDto} from '../../dtos';
import {GetDefectService} from '../get-defect.service';

describe('A get-defect service', () => {
    const defectRepository = mock<DefectRepository>();
    const getDefectService = new GetDefectService(defectRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a defect', async () => {
        const existingDefect = fakeDefect();
        const payload: GetDefectDto = {
            id: existingDefect.id,
        };

        jest.spyOn(defectRepository, 'findById').mockResolvedValueOnce(existingDefect);

        await expect(getDefectService.execute({actor, payload})).resolves.toEqual(new DefectDto(existingDefect));

        expect(existingDefect.events).toHaveLength(0);
        expect(defectRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the defect does not exist', async () => {
        const payload: GetDefectDto = {
            id: DefectId.generate(),
        };

        jest.spyOn(defectRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getDefectService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Defect not found'
        );
    });
});
