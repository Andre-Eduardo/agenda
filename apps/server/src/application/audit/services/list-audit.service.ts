import {Injectable} from '@nestjs/common';
import {AuditRepository} from '../../../domain/audit/audit.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {AuditDto, ListAuditDto} from '../dtos';

@Injectable()
export class ListAuditService implements ApplicationService<ListAuditDto, PaginatedDto<AuditDto>> {
    constructor(private readonly auditRepository: AuditRepository) {}

    async execute({payload}: Command<ListAuditDto>): Promise<PaginatedDto<AuditDto>> {
        const result = await this.auditRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                roomId: payload.roomId,
                startedById: payload.startedById,
                finishedById: payload.finishedById,
                reason: payload.reason,
                endReason: payload.endReason,
            }
        );

        return {
            ...result,
            data: result.data.map((audit) => new AuditDto(audit)),
        };
    }
}
