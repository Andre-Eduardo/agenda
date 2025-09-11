import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DuplicateNameException, PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectTypeRepository} from '../../../../domain/defect-type/defect-type.repository';
import {DefectType} from '../../../../domain/defect-type/entities';
import {fakeDefectType} from '../../../../domain/defect-type/entities/__tests__/fake-defect-type';
import {DefectTypeCreatedEvent} from '../../../../domain/defect-type/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {CreateDefectTypeDto} from '../../dtos';
import {DefectTypeDto} from '../../dtos';
import {CreateDefectTypeService} from '../create-defect-type.service';

describe('A create-defect-type service', () => {
    const defectTypeRepository = mock<DefectTypeRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createDefectTypeService = new CreateDefectTypeService(defectTypeRepository, eventDispatcher);

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

    it('should create a defect type', async () => {
        const payload: CreateDefectTypeDto = {
            companyId,
            name: 'Defect type 1',
        };

        const defectType = DefectType.create({
            companyId,
            name: 'Defect type 1',
        });

        jest.spyOn(DefectType, 'create').mockReturnValue(defectType);

        await expect(createDefectTypeService.execute({actor, payload})).resolves.toEqual(new DefectTypeDto(defectType));

        expect(defectType.events[0]).toBeInstanceOf(DefectTypeCreatedEvent);
        expect(defectType.events).toEqual([
            {
                type: DefectTypeCreatedEvent.type,
                defectType,
                companyId: defectType.companyId,
                timestamp: now,
            },
        ]);

        expect(DefectType.create).toHaveBeenCalledWith(payload);
        expect(defectTypeRepository.save).toHaveBeenCalledWith(defectType);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, defectType);
    });

    it('should throw an error if the defect type name is already in use', async () => {
        const payload: CreateDefectTypeDto = {
            companyId,
            name: 'Defect type 1',
        };

        const defectType = fakeDefectType({
            companyId,
            name: 'Defect type 1',
        });

        jest.spyOn(DefectType, 'create').mockReturnValue(defectType);
        jest.spyOn(defectTypeRepository, 'save').mockRejectedValue(
            new DuplicateNameException('Duplicated defect type name')
        );

        await expect(createDefectTypeService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a defect type with a name already in use.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the defect type', async () => {
        const payload: CreateDefectTypeDto = {
            companyId,
            name: 'Defect type 1',
        };

        const defectType = fakeDefectType({
            companyId,
            name: 'Defect type 1',
        });

        jest.spyOn(DefectType, 'create').mockReturnValue(defectType);
        jest.spyOn(defectTypeRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(createDefectTypeService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });
});
