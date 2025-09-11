import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DeepCleaningRepository} from '../../../domain/deep-cleaning/deep-cleaning.repository';
import {DeepCleaning, DeepCleaningEndReasonType} from '../../../domain/deep-cleaning/entities';
import {EventDispatcher} from '../../../domain/event';
import {Room} from '../../../domain/room/entities';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {FinishDeepCleaningDto} from '../dtos';
import {DeepCleaningDto} from '../dtos';

@Injectable()
export class FinishDeepCleaningService implements ApplicationService<FinishDeepCleaningDto, DeepCleaningDto> {
    constructor(
        private readonly deepCleaningRepository: DeepCleaningRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<FinishDeepCleaningDto>): Promise<DeepCleaningDto> {
        const deepCleaning = await this.deepCleaningRepository.findByRoom(payload.roomId);

        if (!deepCleaning) {
            throw new ResourceNotFoundException('Deep cleaning not found', payload.roomId.toString());
        }

        deepCleaning.finish({
            finishedById: actor.userId,
            endReason: payload.endReason,
        });

        const room = await this.changeRoomState(deepCleaning);

        await this.deepCleaningRepository.save(deepCleaning);

        this.eventDispatcher.dispatch(actor, deepCleaning);
        this.eventDispatcher.dispatch(actor, room);

        return new DeepCleaningDto(deepCleaning);
    }

    private async changeRoomState(deepCleaning: DeepCleaning): Promise<Room> {
        if (deepCleaning.endReason === DeepCleaningEndReasonType.FINISHED) {
            return this.roomStateService.changeRoomState(deepCleaning.roomId, {
                type: RoomStateEvent.COMPLETE_DEEP_CLEANING,
                // TODO: Add the right parameters
                autoRentWhenCarInGarage: false,
                inspectionEnabled: true,
                inspectionTimeout: 60 * 60,
            });
        }

        return this.roomStateService.changeRoomState(deepCleaning.roomId, {
            type: RoomStateEvent.CANCEL_DEEP_CLEANING,
        });
    }
}
