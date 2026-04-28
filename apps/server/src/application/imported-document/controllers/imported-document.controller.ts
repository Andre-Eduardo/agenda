import {Body, Controller, Get, HttpCode, HttpStatus, Patch, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ImportedDocumentId} from '../../../domain/record/entities/imported-document.entity';
import {ImportedDocumentPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {UseUsageLimit} from '../../subscription/decorators/use-usage-limit.decorator';
import {DraftEvolutionDto, GetDraftDto, UpdateDraftBodyDto, getDraftSchema, updateDraftBodySchema} from '../dtos';
import {ApproveDraftService, GetOrCreateDraftService, UpdateDraftService} from '../services';

@ApiTags('ImportedDocument')
@Controller('imported-documents')
export class ImportedDocumentController {
    constructor(
        private readonly getOrCreateDraftService: GetOrCreateDraftService,
        private readonly updateDraftService: UpdateDraftService,
        private readonly approveDraftService: ApproveDraftService,
    ) {}

    @ApiOperation({
        summary: 'Gets or initializes the AI draft for an imported document',
        parameters: [entityIdParam('ImportedDocument ID')],
        responses: [{status: 200, description: 'Draft evolution', type: DraftEvolutionDto}],
    })
    @Authorize(ImportedDocumentPermission.VIEW)
    @Get(':id/draft')
    async getDraft(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getDraftSchema.shape.id) id: ImportedDocumentId
    ): Promise<DraftEvolutionDto> {
        return this.getOrCreateDraftService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Saves professional edits to the draft',
        parameters: [entityIdParam('ImportedDocument ID')],
        responses: [{status: 200, description: 'Draft updated', type: DraftEvolutionDto}],
    })
    @Authorize(ImportedDocumentPermission.UPDATE)
    @Patch(':id/draft')
    async updateDraft(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getDraftSchema.shape.id) id: ImportedDocumentId,
        @Body() body: UpdateDraftBodyDto
    ): Promise<DraftEvolutionDto> {
        return this.updateDraftService.execute({actor, payload: {id, ...body}});
    }

    @ApiOperation({
        summary: 'Approves the draft and creates the official Record',
        parameters: [entityIdParam('ImportedDocument ID')],
        responses: [{status: 200, description: 'Draft approved and Record created', type: DraftEvolutionDto}],
    })
    @Authorize(ImportedDocumentPermission.UPDATE)
    @UseUsageLimit('docs')
    @HttpCode(HttpStatus.OK)
    @Post(':id/approve')
    async approveDraft(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getDraftSchema.shape.id) id: ImportedDocumentId
    ): Promise<DraftEvolutionDto> {
        return this.approveDraftService.execute({actor, payload: {id}});
    }
}
