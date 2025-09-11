import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectTypeRepository} from '../../../../domain/defect-type/defect-type.repository';
import {DefectTypeId} from '../../../../domain/defect-type/entities';
import {fakeDefectType} from '../../../../domain/defect-type/entities/__tests__/fake-defect-type';
import {DefectTypeChangedEvent} from '../../../../domain/defect-type/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateDefectTypeDto} from '../../dtos';
import {DefectTypeDto} from '../../dtos';
import {UpdateDefectTypeService} from '../update-defect-type.service';

describe('A update-defect-type service', () => {
    const defectTypeRepository = mock<DefectTypeRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateDefectTypeService = new UpdateDefectTypeService(defectTypeRepository, eventDispatcher);

    const companyId = CompanyId.generate();

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

    it('should update a defect type', async () => {
        const existingDefectType = fakeDefectType({
            companyId,
            name: 'Defect type 1',
        });

        const oldDefectType = fakeDefectType(existingDefectType);

        const payload: UpdateDefectTypeDto = {
            id: existingDefectType.id,
            name: 'Defect type 2',
        };

        jest.spyOn(defectTypeRepository, 'findById').mockResolvedValueOnce(existingDefectType);

        const updateDefectType = fakeDefectType({
            ...existingDefectType,
            ...payload,
            updatedAt: now,
        });

        await expect(updateDefectTypeService.execute({actor, payload})).resolves.toEqual(
            new DefectTypeDto(updateDefectType)
        );

        expect(existingDefectType.name).toBe(payload.name);
        expect(existingDefectType.updatedAt).toEqual(now);
        expect(existingDefectType.events).toHaveLength(1);
        expect(existingDefectType.events[0]).toBeInstanceOf(DefectTypeChangedEvent);
        expect(existingDefectType.events).toEqual([
            {
                type: DefectTypeChangedEvent.type,
                companyId: existingDefectType.companyId,
                timestamp: now,
                oldState: oldDefectType,
                newState: existingDefectType,
            },
        ]);
        expect(defectTypeRepository.save).toHaveBeenCalledWith(existingDefectType);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingDefectType);
    });

    it('should throw an error if the defect type name is already in use', async () => {
        const payload: UpdateDefectTypeDto = {
            id: DefectTypeId.generate(),
            companyId,
            name: 'Defect type 1',
        };

        const existingDefectType = fakeDefectType({
            companyId,
            name: 'Defect type 1',
        });

        jest.spyOn(defectTypeRepository, 'findById').mockResolvedValueOnce(existingDefectType);
        jest.spyOn(defectTypeRepository, 'save').mockRejectedValue(
            new DuplicateNameException('Duplicated defect type name')
        );

        await expect(updateDefectTypeService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a defect type with a name already in use.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the defect type', async () => {
        const payload: UpdateDefectTypeDto = {
            id: DefectTypeId.generate(),
            companyId,
            name: 'Defect type 1',
        };

        const existingDefectType = fakeDefectType({
            companyId,
            name: 'Defect type 1',
        });

        jest.spyOn(defectTypeRepository, 'findById').mockResolvedValueOnce(existingDefectType);
        jest.spyOn(defectTypeRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(updateDefectTypeService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });

    it('should throw an error when the defect type does not exist', async () => {
        const payload: UpdateDefectTypeDto = {
            id: DefectTypeId.generate(),
            name: 'Defect type 2',
        };

        jest.spyOn(defectTypeRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateDefectTypeService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Defect type not found'
        );
    });
});
