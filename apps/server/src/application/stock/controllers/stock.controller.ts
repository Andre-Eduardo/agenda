import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {StockPermission} from '../../../domain/auth';
import {StockId} from '../../../domain/stock/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    CreateStockDto,
    deleteStockSchema,
    getStockSchema,
    ListStockDto,
    StockDto,
    UpdateStockInputDto,
    updateStockSchema,
} from '../dtos';
import {
    CreateStockService,
    GetStockService,
    ListStockService,
    UpdateStockService,
    DeleteStockService,
} from '../services';

@ApiTags('Stock')
@Controller('stock')
export class StockController {
    constructor(
        private readonly createStockService: CreateStockService,
        private readonly getStockService: GetStockService,
        private readonly listStockService: ListStockService,
        private readonly updateStockService: UpdateStockService,
        private readonly deleteStockService: DeleteStockService
    ) {}

    @ApiOperation({
        summary: 'Creates a new stock',
        responses: [
            {
                status: 201,
                description: 'Stock created',
                type: StockDto,
            },
        ],
    })
    @Authorize(StockPermission.CREATE)
    @Post()
    async createStock(@RequestActor() actor: Actor, @Body() payload: CreateStockDto): Promise<StockDto> {
        return this.createStockService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a stock',
        parameters: [entityIdParam('Stock ID')],
        responses: [{status: 200, description: 'Stock found', type: StockDto}],
    })
    @Authorize(StockPermission.VIEW)
    @Get(':id')
    async getStock(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getStockSchema.shape.id) id: StockId
    ): Promise<StockDto> {
        return this.getStockService.execute({actor, payload: {id}});
    }

    @ApiPaginatedOperation({
        summary: 'Finds stocks',
        responses: [
            {
                status: 200,
                description: 'Stock found',
                model: StockDto,
            },
        ],
    })
    @Authorize(StockPermission.VIEW)
    @Get()
    async listStocks(@RequestActor() actor: Actor, @Query() payload: ListStockDto): Promise<PaginatedDto<StockDto>> {
        return this.listStockService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a stock',
        parameters: [entityIdParam('Stock ID')],
        responses: [
            {
                status: 200,
                description: 'Stock updated',
                type: StockDto,
            },
        ],
    })
    @Authorize(StockPermission.UPDATE)
    @Put(':id')
    async updateStock(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateStockSchema.shape.id) id: StockId,
        @Body() payload: UpdateStockInputDto
    ): Promise<StockDto> {
        return this.updateStockService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a stock',
        parameters: [entityIdParam('Stock ID')],
        responses: [
            {
                status: 200,
                description: 'Stock deleted',
            },
        ],
    })
    @Authorize(StockPermission.DELETE)
    @Delete(':id')
    async deleteStock(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteStockSchema.shape.id) id: StockId
    ): Promise<void> {
        await this.deleteStockService.execute({actor, payload: {id}});
    }
}
