import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import {DefectId} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {DefectChangedEvent} from '../../../../domain/defect/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateDefectDto} from '../../dtos';
import {DefectDto} from '../../dtos';
import {UpdateDefectService} from '../update-defect.service';

describe('A update-defect service', () => {
    const defectRepository = mock<DefectRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateDefectService = new UpdateDefectService(defectRepository, eventDispatcher);

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

    it('should update a defect', async () => {
        const existingDefect = fakeDefect();

        const oldDefect = fakeDefect(existingDefect);

        const payload: UpdateDefectDto = {
            id: existingDefect.id,
            note: 'new defect',
        };

        jest.spyOn(defectRepository, 'findById').mockResolvedValueOnce(existingDefect);

        const updatedDefect = fakeDefect({
            ...existingDefect,
            ...payload,
            updatedAt: now,
        });

        await expect(updateDefectService.execute({actor, payload})).resolves.toEqual(new DefectDto(updatedDefect));

        expect(existingDefect.note).toBe(payload.note);
        expect(existingDefect.updatedAt).toEqual(now);
        expect(existingDefect.events).toHaveLength(1);
        expect(existingDefect.events[0]).toBeInstanceOf(DefectChangedEvent);
        expect(existingDefect.events).toEqual([
            {
                type: DefectChangedEvent.type,
                companyId: existingDefect.companyId,
                timestamp: now,
                oldState: oldDefect,
                newState: existingDefect,
            },
        ]);
        expect(defectRepository.save).toHaveBeenCalledWith(existingDefect);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingDefect);
    });

    it('should throw an error when the defect does not exist', async () => {
        const payload: UpdateDefectDto = {
            id: DefectId.generate(),
            note: 'new defect',
        };

        jest.spyOn(defectRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateDefectService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Defect not found'
        );
    });
});
