import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DuplicateNameException, PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomCategory} from '../../../../domain/room-category/entities';
import {RoomCategoryCreatedEvent} from '../../../../domain/room-category/events';
import {DuplicateAcronymException} from '../../../../domain/room-category/room-category.exceptions';
import type {RoomCategoryRepository} from '../../../../domain/room-category/room-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {CreateRoomCategoryDto} from '../../dtos';
import {RoomCategoryDto} from '../../dtos';
import {CreateRoomCategoryService} from '../create-room-category.service';

describe('A create-room-category service', () => {
    const roomCategoryRepository = mock<RoomCategoryRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createCategoryService = new CreateRoomCategoryService(roomCategoryRepository, eventDispatcher);

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

    it('should create a room category', async () => {
        const payload: CreateRoomCategoryDto = {
            companyId,
            name: 'CHIHIRO',
            acronym: 'CH',
            guestCount: 10,
        };

        const roomCategory = RoomCategory.create({
            companyId,
            name: 'LOVE',
            acronym: 'LV',
            guestCount: 10,
        });

        jest.spyOn(RoomCategory, 'create').mockReturnValue(roomCategory);

        await expect(createCategoryService.execute({actor, payload})).resolves.toEqual(
            new RoomCategoryDto(roomCategory)
        );

        expect(RoomCategory.create).toHaveBeenCalledWith(payload);

        expect(roomCategory.events[0]).toBeInstanceOf(RoomCategoryCreatedEvent);
        expect(roomCategory.events).toEqual([
            {
                type: RoomCategoryCreatedEvent.type,
                roomCategory,
                companyId: roomCategory.companyId,
                timestamp: now,
            },
        ]);

        expect(roomCategoryRepository.save).toHaveBeenCalledWith(roomCategory);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, roomCategory);
    });

    it('should throw an error if the room category name is already in use', async () => {
        const payload: CreateRoomCategoryDto = {
            companyId,
            name: 'Lush',
            acronym: 'Ls',
            guestCount: 10,
        };

        const roomCategory = RoomCategory.create({
            companyId,
            name: 'Savana',
            acronym: 'sv',
            guestCount: 10,
        });

        jest.spyOn(RoomCategory, 'create').mockReturnValue(roomCategory);
        jest.spyOn(roomCategoryRepository, 'save').mockRejectedValue(new DuplicateNameException('Duplicated name'));

        await expect(createCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a room category with a name already in use.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error if the room category acronym is already in use', async () => {
        const payload: CreateRoomCategoryDto = {
            companyId,
            name: 'Suite Belle',
            acronym: 'SB',
            guestCount: 10,
        };

        const roomCategory = RoomCategory.create({
            companyId,
            name: 'ELECTRA',
            acronym: 'EC',
            guestCount: 10,
        });

        jest.spyOn(RoomCategory, 'create').mockReturnValue(roomCategory);
        jest.spyOn(roomCategoryRepository, 'save').mockRejectedValue(new DuplicateAcronymException('Duplicated name'));

        await expect(createCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a room category with an acronym already in use.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the room category', async () => {
        const payload: CreateRoomCategoryDto = {
            companyId,
            name: 'Barcelona',
            acronym: 'BL',
            guestCount: 10,
        };

        const roomCategory = RoomCategory.create({
            companyId,
            name: 'Cannes',
            acronym: 'CN',
            guestCount: 10,
        });

        jest.spyOn(RoomCategory, 'create').mockReturnValue(roomCategory);
        jest.spyOn(roomCategoryRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(createCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });
});
