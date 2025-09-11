import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {CleaningRepository} from '../../../domain/cleaning/cleaning.repository';
import {Cleaning} from '../../../domain/cleaning/entities';
import {EventDispatcher} from '../../../domain/event';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import {ApplicationService, Command} from '../../@shared/application.service';
import {StartCleaningDto} from '../dtos';
import {CleaningDto} from '../dtos/cleaning.dto';

@Injectable()
export class StartCleaningService implements ApplicationService<StartCleaningDto, CleaningDto> {
    constructor(
        private readonly cleaningRepository: CleaningRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<StartCleaningDto>): Promise<CleaningDto> {
        const existingCleaning = await this.cleaningRepository.findByRoom(payload.roomId);

        if (existingCleaning !== null) {
            throw new PreconditionException('There is already a cleaning in this room.');
        }

        const cleaning = Cleaning.start({...payload, startedById: actor.userId});

        const room = await this.roomStateService.changeRoomState(cleaning.roomId, {
            type: RoomStateEvent.PERFORM_CLEANING,
            // TODO: Add the right cleaning timeout
            cleaningTimeout: 60 * 60,
        });

        await this.cleaningRepository.save(cleaning);

        this.eventDispatcher.dispatch(actor, cleaning);
        this.eventDispatcher.dispatch(actor, room);

        return new CleaningDto(cleaning);
    }
}
