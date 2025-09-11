import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {AuditRepository} from '../../../domain/audit/audit.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AuditDto, GetAuditDto} from '../dtos';

@Injectable()
export class GetAuditService implements ApplicationService<GetAuditDto, AuditDto> {
    constructor(private readonly auditRepository: AuditRepository) {}

    async execute({payload}: Command<GetAuditDto>): Promise<AuditDto> {
        const audit = await this.auditRepository.findById(payload.id);

        if (!audit) {
            throw new ResourceNotFoundException('Audit not found', payload.id.toString());
        }

        return new AuditDto(audit);
    }
}
