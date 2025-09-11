import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import {DefectId} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {DefectFinishedEvent} from '../../../../domain/defect/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {FinishDefectDto} from '../../dtos';
import {FinishDefectService} from '../finish-defect.service';

describe('A finish-defect service', () => {
    const defectRepository = mock<DefectRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const finishDefectService = new FinishDefectService(defectRepository, eventDispatcher);

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

    it('should finish a defect', async () => {
        const existingDefect = fakeDefect();

        const payload: FinishDefectDto = {
            id: existingDefect.id,
        };

        jest.spyOn(defectRepository, 'findById').mockResolvedValueOnce(existingDefect);

        await finishDefectService.execute({actor, payload});

        expect(existingDefect.events).toHaveLength(1);
        expect(existingDefect.finishedById).toEqual(actor.userId);
        expect(existingDefect.finishedAt).toEqual(now);
        expect(existingDefect.events[0]).toBeInstanceOf(DefectFinishedEvent);
        expect(existingDefect.events).toEqual([
            {
                type: DefectFinishedEvent.type,
                companyId: existingDefect.companyId,
                timestamp: now,
                defectId: existingDefect.id,
                finishedById: actor.userId,
            },
        ]);
        expect(defectRepository.save).toHaveBeenCalledWith(existingDefect);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingDefect);
    });

    it('should throw an error when the defect does not exist', async () => {
        const payload: FinishDefectDto = {
            id: DefectId.generate(),
        };

        jest.spyOn(defectRepository, 'findById').mockResolvedValueOnce(null);

        await expect(finishDefectService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Defect not found'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
