import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {DeepCleaningRepository} from '../../../domain/deep-cleaning/deep-cleaning.repository';
import {DeepCleaning} from '../../../domain/deep-cleaning/entities';
import {EventDispatcher} from '../../../domain/event';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {StartDeepCleaningDto, DeepCleaningDto} from '../dtos';

@Injectable()
export class StartDeepCleaningService implements ApplicationService<StartDeepCleaningDto, DeepCleaningDto> {
    constructor(
        private readonly deepCleaningRepository: DeepCleaningRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<StartDeepCleaningDto>): Promise<DeepCleaningDto> {
        const existingDeepCleaning = await this.deepCleaningRepository.findByRoom(payload.roomId);

        if (existingDeepCleaning !== null) {
            throw new PreconditionException('There is already a deep cleaning in this room.');
        }

        const deepCleaning = DeepCleaning.start({...payload, startedById: actor.userId});

        const room = await this.roomStateService.changeRoomState(deepCleaning.roomId, {
            type: RoomStateEvent.PERFORM_DEEP_CLEANING,
            // TODO: Add the right deep cleaning timeout
            deepCleaningTimeout: 60 * 60,
        });

        await this.deepCleaningRepository.save(deepCleaning);

        this.eventDispatcher.dispatch(actor, deepCleaning);
        this.eventDispatcher.dispatch(actor, room);

        return new DeepCleaningDto(deepCleaning);
    }
}
