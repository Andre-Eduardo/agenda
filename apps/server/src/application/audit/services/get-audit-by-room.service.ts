import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {AuditRepository} from '../../../domain/audit/audit.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AuditDto, GetAuditByRoomDto} from '../dtos';

@Injectable()
export class GetAuditByRoomService implements ApplicationService<GetAuditByRoomDto, AuditDto> {
    constructor(private readonly auditRepository: AuditRepository) {}

    async execute({payload}: Command<GetAuditByRoomDto>): Promise<AuditDto> {
        const audit = await this.auditRepository.findByRoom(payload.roomId);

        if (!audit) {
            throw new ResourceNotFoundException('Audit not found for the room', payload.roomId.toString());
        }

        return new AuditDto(audit);
    }
}
