import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {AuditRepository} from '../../../domain/audit/audit.repository';
import {Audit} from '../../../domain/audit/entities';
import {EventDispatcher} from '../../../domain/event';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AuditDto, StartAuditDto} from '../dtos';

@Injectable()
export class StartAuditService implements ApplicationService<StartAuditDto, AuditDto> {
    constructor(
        private readonly auditRepository: AuditRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<StartAuditDto>): Promise<AuditDto> {
        const existingAudit = await this.auditRepository.findByRoom(payload.roomId);

        if (existingAudit !== null) {
            throw new PreconditionException('There is already an audit in this room.');
        }

        const audit = Audit.start({...payload});

        await this.auditRepository.save(audit);

        // TODO: Add the right audit timeout
        const room = await this.roomStateService.changeRoomState(payload.roomId, {
            type: RoomStateEvent.AUDIT,
            auditTimeout: 60 * 60,
        });

        this.eventDispatcher.dispatch(actor, audit);
        this.eventDispatcher.dispatch(actor, room);

        return new AuditDto(audit);
    }
}
