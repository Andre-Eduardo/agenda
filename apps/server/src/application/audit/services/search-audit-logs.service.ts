import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AuditLogDto, PaginatedAuditLogDto} from '@application/audit/dtos/audit-log.dto';
import {SearchAuditLogsDto} from '@application/audit/dtos/search-audit-logs.dto';
import {AuditLogRepository} from '@domain/audit/audit-log.repository';

@Injectable()
export class SearchAuditLogsService implements ApplicationService<SearchAuditLogsDto, PaginatedAuditLogDto> {
    constructor(private readonly auditLogRepository: AuditLogRepository) {}

    async execute({actor, payload}: Command<SearchAuditLogsDto>): Promise<PaginatedAuditLogDto> {
        const result = await this.auditLogRepository.search(
            actor.clinicId.toString(),
            payload.page ?? 1,
            payload.pageSize ?? 50
        );

        return {data: result.data.map((entry) => new AuditLogDto(entry)), totalCount: result.totalCount};
    }
}
