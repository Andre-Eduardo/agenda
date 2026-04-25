import {Body, Controller, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {DocumentPermissionDto, GrantDocumentPermissionDto} from '../dtos';
import {GrantDocumentPermissionService} from '../services';

@ApiTags('DocumentPermission')
@Controller('document-permissions')
export class DocumentPermissionController {
    constructor(private readonly grantService: GrantDocumentPermissionService) {}

    @ApiOperation({
        summary: 'Grant or revoke a per-document permission',
        responses: [{status: 201, description: 'Permission granted', type: DocumentPermissionDto}],
    })
    @Post()
    async grantPermission(
        @RequestActor() actor: Actor,
        @Body() payload: GrantDocumentPermissionDto,
    ): Promise<DocumentPermissionDto> {
        return this.grantService.execute({actor, payload});
    }
}
