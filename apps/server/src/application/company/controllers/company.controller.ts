import {Body, Controller, Delete, Get, Post, Put, Query, Res} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {Actor} from '../../../domain/@shared/actor';
import {CompanyPermission} from '../../../domain/auth';
import {CompanyId} from '../../../domain/company/entities';
import {Authorize} from '../../@shared/auth';
import {BypassCompany} from '../../@shared/auth/bypass-company.decorator';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateCompanyDto,
    getCompanySchema,
    UpdateCompanyInputDto,
    updateCompanySchema,
    CompanyDto,
    deleteCompanySchema,
    ListCompanyDto,
} from '../dtos';
import {
    CreateCompanyService,
    DeleteCompanyService,
    GetCompanyService,
    ListCompanyService,
    UpdateCompanyService,
} from '../services';

@BypassCompany()
@ApiTags('Company')
@Controller('company')
export class CompanyController {
    constructor(
        private readonly createCompanyService: CreateCompanyService,
        private readonly listCompanyService: ListCompanyService,
        private readonly getCompanyService: GetCompanyService,
        private readonly updateCompanyService: UpdateCompanyService,
        private readonly deleteCompanyService: DeleteCompanyService
    ) {}

    @ApiOperation({
        summary: 'Creates a new company',
        responses: [
            {
                status: 201,
                description: 'Company created',
                type: CompanyDto,
            },
        ],
    })
    @Authorize(CompanyPermission.CREATE)
    @Post()
    async createCompany(
        @RequestActor() actor: Actor,
        @Body() payload: CreateCompanyDto,
        @Res({passthrough: true}) response: Response
    ): Promise<CompanyDto> {
        const {token, company} = await this.createCompanyService.execute({actor, payload});

        response.actions.setToken(token);

        // When the user create the first company, it will be set as the current company.
        if (token.companies.length === 1) {
            response.actions.setCompany(token.companies[0]);
        }

        return company;
    }

    @ApiPaginatedOperation({
        summary: 'Finds companies',
        responses: [
            {
                status: 200,
                description: 'Companies found',
                model: CompanyDto,
            },
        ],
    })
    @Authorize(CompanyPermission.VIEW)
    @Get()
    async listCompany(
        @RequestActor() actor: Actor,
        @Query() payload: ListCompanyDto
    ): Promise<PaginatedDto<CompanyDto>> {
        return this.listCompanyService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a company',
        parameters: [entityIdParam('Company ID')],
        responses: [
            {
                status: 200,
                description: 'Company found',
                type: CompanyDto,
            },
        ],
    })
    @Authorize(CompanyPermission.VIEW)
    @Get(':id')
    async getCompany(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getCompanySchema.shape.id) id: CompanyId
    ): Promise<CompanyDto> {
        return this.getCompanyService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a company',
        parameters: [entityIdParam('Company ID')],
        responses: [
            {
                status: 200,
                description: 'Company updated',
                type: CompanyDto,
            },
        ],
    })
    @Authorize(CompanyPermission.UPDATE)
    @Put(':id')
    async updateCompany(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateCompanySchema.shape.id) id: CompanyId,
        @Body() payload: UpdateCompanyInputDto
    ): Promise<CompanyDto> {
        return this.updateCompanyService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a company',
        parameters: [entityIdParam('Company ID')],
        responses: [
            {
                status: 200,
                description: 'Company deleted',
            },
        ],
    })
    @Authorize(CompanyPermission.DELETE)
    @Delete(':id')
    async deleteCompany(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteCompanySchema.shape.id) id: CompanyId
    ): Promise<void> {
        await this.deleteCompanyService.execute({actor, payload: {id}});
    }
}
