import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import {Defect} from '../../../../domain/defect/entities';
import {DefectCreatedEvent} from '../../../../domain/defect/events';
import {DefectTypeId} from '../../../../domain/defect-type/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {CreateDefectDto} from '../../dtos';
import {DefectDto} from '../../dtos';
import {CreateDefectService} from '../create-defect.service';

describe('A create-defect service', () => {
    const defectRepository = mock<DefectRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createDefectService = new CreateDefectService(defectRepository, eventDispatcher);

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

    it('should create a defect', async () => {
        const payload: CreateDefectDto = {
            companyId,
            note: 'defect 1',
            roomId: RoomId.generate(),
            defectTypeId: DefectTypeId.generate(),
        };

        const defect = Defect.create({
            ...payload,
            createdById: actor.userId,
        });

        jest.spyOn(Defect, 'create').mockReturnValue(defect);

        await expect(createDefectService.execute({actor, payload})).resolves.toEqual(new DefectDto(defect));

        expect(Defect.create).toHaveBeenCalledWith({...payload, createdById: actor.userId});

        expect(defect.events).toHaveLength(1);
        expect(defect.events[0]).toBeInstanceOf(DefectCreatedEvent);
        expect(defect.events).toEqual([
            {
                type: DefectCreatedEvent.type,
                companyId,
                timestamp: now,
                defect,
            },
        ]);
        expect(defectRepository.save).toHaveBeenCalledWith(defect);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, defect);
    });
});
