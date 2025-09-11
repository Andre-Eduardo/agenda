import {Body, Controller, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {DirectSalePermission} from '../../../domain/auth';
import {SaleId} from '../../../domain/sale/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    ListDirectSaleDto,
    CreateDirectSaleDto,
    DirectSaleDto,
    UpdateDirectSaleInputDto,
    getDirectSaleSchema,
    updateDirectSaleSchema,
} from '../dtos';
import {
    CreateDirectSaleService,
    GetDirectSaleService,
    ListDirectSaleService,
    UpdateDirectSaleService,
} from '../services';

@ApiTags('Direct sale')
@Controller('direct-sale')
export class DirectSaleController {
    constructor(
        private readonly createDirectSaleService: CreateDirectSaleService,
        private readonly getDirectSaleService: GetDirectSaleService,
        private readonly listDirectSaleService: ListDirectSaleService,
        private readonly updateDirectSaleService: UpdateDirectSaleService
    ) {}

    @ApiOperation({
        summary: 'Creates a new direct sale',
        responses: [
            {
                status: 201,
                description: 'Direct sale created',
                type: DirectSaleDto,
            },
        ],
    })
    @Authorize(DirectSalePermission.CREATE)
    @Post()
    async createDirectSale(@RequestActor() actor: Actor, @Body() payload: CreateDirectSaleDto): Promise<DirectSaleDto> {
        return this.createDirectSaleService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a direct sale',
        parameters: [entityIdParam('Direct sale ID')],
        responses: [
            {
                status: 200,
                description: 'Direct sale found',
                type: DirectSaleDto,
            },
        ],
    })
    @Authorize(DirectSalePermission.VIEW)
    @Get(':id')
    async getDirectSale(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getDirectSaleSchema.shape.id) id: SaleId
    ): Promise<DirectSaleDto> {
        return this.getDirectSaleService.execute({actor, payload: {id}});
    }

    @ApiPaginatedOperation({
        summary: 'Finds direct sales',
        responses: [
            {
                status: 200,
                description: 'Direct sale found',
                model: DirectSaleDto,
            },
        ],
    })
    @Authorize(DirectSalePermission.VIEW)
    @Get()
    async listDirectSale(
        @RequestActor() actor: Actor,
        @Query() payload: ListDirectSaleDto
    ): Promise<PaginatedDto<DirectSaleDto>> {
        return this.listDirectSaleService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a direct sale',
        parameters: [entityIdParam('Direct sale ID')],
        responses: [
            {
                status: 200,
                description: 'Direct sale updated',
                type: DirectSaleDto,
            },
        ],
    })
    @Authorize(DirectSalePermission.UPDATE)
    @Put(':id')
    async updateDirectSale(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateDirectSaleSchema.shape.id) id: SaleId,
        @Body() payload: UpdateDirectSaleInputDto
    ): Promise<DirectSaleDto> {
        return this.updateDirectSaleService.execute({actor, payload: {id, ...payload}});
    }
}
