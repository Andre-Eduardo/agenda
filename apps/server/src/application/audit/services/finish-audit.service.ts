import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {AuditRepository} from '../../../domain/audit/audit.repository';
import {AuditEndReasonType} from '../../../domain/audit/entities';
import {EventDispatcher} from '../../../domain/event';
import {RoomState, RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AuditDto, FinishAuditDto} from '../dtos';

@Injectable()
export class FinishAuditService implements ApplicationService<FinishAuditDto, AuditDto> {
    constructor(
        private readonly auditRepository: AuditRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<FinishAuditDto>): Promise<AuditDto> {
        const audit = await this.auditRepository.findByRoom(payload.roomId);

        if (!audit) {
            throw new ResourceNotFoundException('Audit not found for room', payload.roomId.toString());
        }

        audit.finish({
            finishedById: actor.userId,
            note: payload.note,
            endReason: AuditEndReasonType.COMPLETED,
        });

        const roomStateEventMap = {
            [RoomState.DIRTY]: RoomStateEvent.COMPLETE_AUDIT_DIRTY,
            [RoomState.VACANT]: RoomStateEvent.COMPLETE_AUDIT_VACANT,
            [RoomState.BLOCKED]: RoomStateEvent.COMPLETE_AUDIT_BLOCKED,
        } as const;

        const room = await this.roomStateService.changeRoomState(payload.roomId, {
            type: roomStateEventMap[payload.nextRoomState],
        });

        await this.auditRepository.save(audit);

        this.eventDispatcher.dispatch(actor, audit);
        this.eventDispatcher.dispatch(actor, room);

        return new AuditDto(audit);
    }
}
