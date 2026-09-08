import {Body, Controller, Get, Patch, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '@application/@shared/validation';
import {
    AuthorizeInsuranceClaimInputDto,
    InsuranceClaimDto,
    ListInsuranceClaimsDto,
    MarkInsuranceClaimPaidInputDto,
    RegisterGlosaInputDto,
    authorizeInsuranceClaimSchema,
    listInsuranceClaimsSchema,
    markInsuranceClaimPaidSchema,
    registerGlosaSchema,
    submitInsuranceClaimSchema,
} from '@application/insurance-claim/dtos';
import {
    AuthorizeInsuranceClaimService,
    ListInsuranceClaimsService,
    MarkInsuranceClaimPaidService,
    RegisterGlosaService,
    SubmitInsuranceClaimService,
} from '@application/insurance-claim/services';
import {Actor} from '@domain/@shared/actor';
import {InsuranceClaimPermission} from '@domain/auth';
import {InsuranceClaimId} from '@domain/insurance-claim/entities';

@ApiTags('InsuranceClaim')
@Controller('insurance-claims')
export class InsuranceClaimController {
    constructor(
        private readonly listClaimsService: ListInsuranceClaimsService,
        private readonly authorizeClaimService: AuthorizeInsuranceClaimService,
        private readonly submitClaimService: SubmitInsuranceClaimService,
        private readonly registerGlosaService: RegisterGlosaService,
        private readonly markClaimPaidService: MarkInsuranceClaimPaidService
    ) {}

    @ApiOperation({
        summary: 'Lists insurance claims for the current clinic',
        responses: [{status: 200, description: 'Insurance claims', type: [InsuranceClaimDto]}],
    })
    @Authorize(InsuranceClaimPermission.VIEW)
    @Get()
    listClaims(
        @RequestActor() actor: Actor,
        @Query(new ZodValidationPipe(listInsuranceClaimsSchema)) query: ListInsuranceClaimsDto
    ): Promise<InsuranceClaimDto[]> {
        return this.listClaimsService.execute({actor, payload: query});
    }

    @ApiOperation({
        summary: 'Registers the authorization code for a claim',
        parameters: [entityIdParam('Insurance claim ID')],
        responses: [{status: 200, description: 'Claim authorized', type: InsuranceClaimDto}],
    })
    @Authorize(InsuranceClaimPermission.UPDATE)
    @Patch(':id/authorize')
    authorize(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', authorizeInsuranceClaimSchema.shape.id) id: InsuranceClaimId,
        @Body() payload: AuthorizeInsuranceClaimInputDto
    ): Promise<InsuranceClaimDto> {
        return this.authorizeClaimService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Submits a claim to the insurer (DRAFT → SUBMITTED)',
        parameters: [entityIdParam('Insurance claim ID')],
        responses: [{status: 200, description: 'Claim submitted', type: InsuranceClaimDto}],
    })
    @Authorize(InsuranceClaimPermission.UPDATE)
    @Patch(':id/submit')
    submit(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', submitInsuranceClaimSchema.shape.id) id: InsuranceClaimId
    ): Promise<InsuranceClaimDto> {
        return this.submitClaimService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Registers a glosa (partial or full denial) for a submitted claim',
        parameters: [entityIdParam('Insurance claim ID')],
        responses: [{status: 200, description: 'Glosa registered', type: InsuranceClaimDto}],
    })
    @Authorize(InsuranceClaimPermission.UPDATE)
    @Patch(':id/glosa')
    registerGlosa(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', registerGlosaSchema.shape.id) id: InsuranceClaimId,
        @Body() payload: RegisterGlosaInputDto
    ): Promise<InsuranceClaimDto> {
        return this.registerGlosaService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Marks a submitted claim as fully paid',
        parameters: [entityIdParam('Insurance claim ID')],
        responses: [{status: 200, description: 'Claim marked as paid', type: InsuranceClaimDto}],
    })
    @Authorize(InsuranceClaimPermission.UPDATE)
    @Patch(':id/paid')
    markPaid(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', markInsuranceClaimPaidSchema.shape.id) id: InsuranceClaimId,
        @Body() payload: MarkInsuranceClaimPaidInputDto
    ): Promise<InsuranceClaimDto> {
        return this.markClaimPaidService.execute({actor, payload: {id, ...payload}});
    }
}
