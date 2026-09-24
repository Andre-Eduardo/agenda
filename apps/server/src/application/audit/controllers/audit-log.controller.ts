import {Controller, Get, Query} from '@nestjs/common';
import {ApiQuery, ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {ZodValidationPipe} from '@application/@shared/validation';
import {PaginatedAuditLogDto} from '@application/audit/dtos/audit-log.dto';
import {SearchAuditLogsDto, searchAuditLogsSchema} from '@application/audit/dtos/search-audit-logs.dto';
import {SearchAuditLogsService} from '@application/audit/services/search-audit-logs.service';
import {Actor} from '@domain/@shared/actor';
import {AuditLogPermission} from '@domain/auth';

@ApiTags('Audit Log')
@Controller('audit-logs')
export class AuditLogController {
    constructor(private readonly searchAuditLogsService: SearchAuditLogsService) {}

    @ApiOperation({
        summary: 'Lists append-only audit entries for the authenticated clinic',
        responses: [{status: 200, description: 'Clinic audit entries', type: PaginatedAuditLogDto}],
    })
    @ApiQuery({name: 'page', required: false, type: Number})
    @ApiQuery({name: 'pageSize', required: false, type: Number})
    @Authorize(AuditLogPermission.VIEW)
    @Get()
    search(
        @RequestActor() actor: Actor,
        @Query(new ZodValidationPipe(searchAuditLogsSchema)) query: SearchAuditLogsDto
    ): Promise<PaginatedAuditLogDto> {
        return this.searchAuditLogsService.execute({actor, payload: query});
    }
}
