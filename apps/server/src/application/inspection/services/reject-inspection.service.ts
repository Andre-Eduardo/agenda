import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {InspectionEndReasonType} from '../../../domain/inspection/entities';
import {InspectionRepository} from '../../../domain/inspection/inspection.repository';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import {ApplicationService, Command} from '../../@shared/application.service';
import {InspectionDto, RejectInspectionDto} from '../dtos';

@Injectable()
export class RejectInspectionService implements ApplicationService<RejectInspectionDto, InspectionDto> {
    constructor(
        private readonly inspectionRepository: InspectionRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<RejectInspectionDto>): Promise<InspectionDto> {
        const inspection = await this.inspectionRepository.findByRoom(payload.roomId);

        if (inspection === null) {
            throw new ResourceNotFoundException('Inspection not found', payload.roomId.toString());
        }

        inspection.finish({
            finishedById: payload.finishedById,
            note: payload.note,
            endReason: InspectionEndReasonType.REJECTED,
        });

        const room = await this.roomStateService.changeRoomState(inspection.roomId, {
            type: RoomStateEvent.REJECT_INSPECTION,
        });

        await this.inspectionRepository.save(inspection);

        this.eventDispatcher.dispatch(actor, inspection);
        this.eventDispatcher.dispatch(actor, room);

        return new InspectionDto(inspection);
    }
}
