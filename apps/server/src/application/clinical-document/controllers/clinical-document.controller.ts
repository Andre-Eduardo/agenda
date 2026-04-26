import {Body, Controller, Delete, Get, HttpCode, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicalDocumentId, ClinicalDocumentType} from '../../../domain/clinical-document/entities';
import {ClinicId} from '../../../domain/clinic/entities';
import {PatientId} from '../../../domain/patient/entities';
import {ClinicalDocumentPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '../../@shared/validation';
import {
    ClinicalDocumentDto,
    ClinicalDocumentTemplateDto,
    CreateDraftDto,
    SearchClinicalDocumentsDto,
    UpsertTemplateDto,
    searchClinicalDocumentsSchema,
    templateTypeParamSchema,
} from '../dtos';
import {
    CancelDocumentService,
    CreateDraftService,
    GeneratePdfService,
    GetDocumentService,
    ListTemplatesService,
    SearchClinicalDocumentsService,
    UpsertTemplateService,
} from '../services';

const documentIdSchema = z.string().uuid().transform((v) => ClinicalDocumentId.from(v));

@ApiTags('ClinicalDocuments')
@Controller('clinical-documents')
export class ClinicalDocumentController {
    constructor(
        private readonly createDraftService: CreateDraftService,
        private readonly generatePdfService: GeneratePdfService,
        private readonly getDocumentService: GetDocumentService,
        private readonly cancelDocumentService: CancelDocumentService,
    ) {}

    @ApiOperation({
        summary: 'Create a clinical document draft',
        responses: [{status: 201, description: 'Draft created', type: ClinicalDocumentDto}],
    })
    @Authorize(ClinicalDocumentPermission.CREATE)
    @Post()
    createDraft(@RequestActor() actor: Actor, @Body() payload: CreateDraftDto): Promise<ClinicalDocumentDto> {
        return this.createDraftService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Generate PDF for a clinical document',
        parameters: [entityIdParam('Document ID', 'id')],
        responses: [{status: 200, description: 'PDF generated', type: ClinicalDocumentDto}],
    })
    @Authorize(ClinicalDocumentPermission.GENERATE)
    @HttpCode(200)
    @Post(':id/generate')
    generatePdf(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', documentIdSchema) documentId: ClinicalDocumentId,
    ): Promise<ClinicalDocumentDto> {
        return this.generatePdfService.execute({actor, payload: {documentId}});
    }

    @ApiOperation({
        summary: 'Get a clinical document by ID',
        parameters: [entityIdParam('Document ID', 'id')],
        responses: [{status: 200, description: 'Clinical document', type: ClinicalDocumentDto}],
    })
    @Authorize(ClinicalDocumentPermission.VIEW)
    @Get(':id')
    getDocument(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', documentIdSchema) documentId: ClinicalDocumentId,
    ): Promise<ClinicalDocumentDto> {
        return this.getDocumentService.execute({actor, payload: {documentId}});
    }

    @ApiOperation({
        summary: 'Cancel a clinical document',
        parameters: [entityIdParam('Document ID', 'id')],
        responses: [{status: 200, description: 'Document cancelled', type: ClinicalDocumentDto}],
    })
    @Authorize(ClinicalDocumentPermission.CANCEL)
    @Delete(':id')
    cancelDocument(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', documentIdSchema) documentId: ClinicalDocumentId,
    ): Promise<ClinicalDocumentDto> {
        return this.cancelDocumentService.execute({actor, payload: {documentId}});
    }
}

@ApiTags('ClinicalDocuments')
@Controller('patients/:patientId/clinical-documents')
export class PatientClinicalDocumentsController {
    constructor(private readonly searchClinicalDocumentsService: SearchClinicalDocumentsService) {}

    @ApiOperation({
        summary: 'List clinical documents for a patient',
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Paginated list of clinical documents'}],
    })
    @Authorize(ClinicalDocumentPermission.VIEW)
    @Get()
    searchDocuments(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', z.string().uuid().transform((v) => PatientId.from(v))) patientId: PatientId,
        @Query(new ZodValidationPipe(searchClinicalDocumentsSchema)) query: SearchClinicalDocumentsDto,
    ): Promise<PaginatedDto<ClinicalDocumentDto>> {
        return this.searchClinicalDocumentsService.execute({actor, payload: {...query, patientId}});
    }
}

@ApiTags('ClinicalDocuments')
@Controller('clinics')
export class DocumentTemplateController {
    constructor(
        private readonly listTemplatesService: ListTemplatesService,
        private readonly upsertTemplateService: UpsertTemplateService,
    ) {}

    @ApiOperation({
        summary: 'List document templates for a clinic',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'List of document templates', type: ClinicalDocumentTemplateDto, isArray: true}],
    })
    @Authorize(ClinicalDocumentPermission.VIEW)
    @Get(':clinicId/document-templates')
    listTemplates(
        @RequestActor() actor: Actor,
        @ValidatedParam('clinicId', z.string().uuid().transform((v) => ClinicId.from(v))) clinicId: ClinicId,
    ): Promise<ClinicalDocumentTemplateDto[]> {
        return this.listTemplatesService.execute({actor, payload: {clinicId}});
    }

    @ApiOperation({
        summary: 'Create or update a document template for a clinic',
        parameters: [
            entityIdParam('Clinic ID', 'clinicId'),
            {name: 'type', description: 'Document type', in: 'path', enum: Object.values(ClinicalDocumentType), type: 'string', required: true},
        ],
        responses: [{status: 200, description: 'Template upserted', type: ClinicalDocumentTemplateDto}],
    })
    @Authorize(ClinicalDocumentPermission.MANAGE_TEMPLATES)
    @HttpCode(200)
    @Put(':clinicId/document-templates/:type')
    upsertTemplate(
        @RequestActor() actor: Actor,
        @ValidatedParam('clinicId', z.string().uuid().transform((v) => ClinicId.from(v))) clinicId: ClinicId,
        @ValidatedParam('type', templateTypeParamSchema.shape.type) type: ClinicalDocumentType,
        @Body() payload: UpsertTemplateDto,
    ): Promise<ClinicalDocumentTemplateDto> {
        return this.upsertTemplateService.execute({actor, payload: {...payload, clinicId, type}});
    }
}
