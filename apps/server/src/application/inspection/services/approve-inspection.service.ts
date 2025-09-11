import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {InspectionEndReasonType} from '../../../domain/inspection/entities';
import {InspectionRepository} from '../../../domain/inspection/inspection.repository';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ApproveInspectionDto, InspectionDto} from '../dtos';

@Injectable()
export class ApproveInspectionService implements ApplicationService<ApproveInspectionDto, InspectionDto> {
    constructor(
        private readonly inspectionRepository: InspectionRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<ApproveInspectionDto>): Promise<InspectionDto> {
        const inspection = await this.inspectionRepository.findByRoom(payload.roomId);

        if (inspection === null) {
            throw new ResourceNotFoundException('Inspection not found', payload.roomId.toString());
        }

        inspection.finish({
            finishedById: payload.finishedById,
            note: payload.note,
            endReason: InspectionEndReasonType.APPROVED,
        });

        const room = await this.roomStateService.changeRoomState(inspection.roomId, {
            type: RoomStateEvent.APPROVE_INSPECTION,
            autoRentWhenCarInGarage: false, // TODO: Implement this when car in garage feature is done
        });

        await this.inspectionRepository.save(inspection);

        this.eventDispatcher.dispatch(actor, inspection);
        this.eventDispatcher.dispatch(actor, room);

        return new InspectionDto(inspection);
    }
}
