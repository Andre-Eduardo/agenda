import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CleaningRepository} from '../../../domain/cleaning/cleaning.repository';
import {Cleaning, CleaningEndReasonType} from '../../../domain/cleaning/entities';
import {EventDispatcher} from '../../../domain/event';
import {Inspection} from '../../../domain/inspection/entities';
import {InspectionRepository} from '../../../domain/inspection/inspection.repository';
import {Room} from '../../../domain/room/entities';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {FinishCleaningDto} from '../dtos';
import {CleaningDto} from '../dtos/cleaning.dto';

@Injectable()
export class FinishCleaningService implements ApplicationService<FinishCleaningDto, CleaningDto> {
    constructor(
        private readonly cleaningRepository: CleaningRepository,
        private readonly inspectionRepository: InspectionRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<FinishCleaningDto>): Promise<CleaningDto> {
        const cleaning = await this.cleaningRepository.findByRoom(payload.roomId);

        if (!cleaning) {
            throw new ResourceNotFoundException('Cleaning not found', payload.roomId.toString());
        }

        cleaning.finish({
            finishedById: actor.userId,
            endReason: payload.endReason,
        });

        const room = await this.changeRoomState(cleaning);

        await this.cleaningRepository.save(cleaning);

        if (cleaning.endReason === CleaningEndReasonType.FINISHED) {
            // TODO: Only start inspection if the module is enabled
            const inspection = Inspection.start({
                startedById: actor.userId,
                companyId: cleaning.companyId,
                roomId: cleaning.roomId,
            });

            await this.inspectionRepository.save(inspection);

            this.eventDispatcher.dispatch(actor, inspection);
        }

        this.eventDispatcher.dispatch(actor, cleaning);
        this.eventDispatcher.dispatch(actor, room);

        return new CleaningDto(cleaning);
    }

    private async changeRoomState(cleaning: Cleaning): Promise<Room> {
        if (cleaning.endReason === CleaningEndReasonType.FINISHED) {
            return this.roomStateService.changeRoomState(cleaning.roomId, {
                type: RoomStateEvent.COMPLETE_CLEANING,
                // TODO: Add the right parameters
                autoRentWhenCarInGarage: false,
                inspectionEnabled: true,
                inspectionTimeout: 60 * 60,
            });
        }

        return this.roomStateService.changeRoomState(cleaning.roomId, {
            type: RoomStateEvent.CANCEL_CLEANING,
        });
    }
}
