import {Body, Controller, Get, Patch, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {CashierPermission} from '../../../domain/auth';
import {CashierId} from '../../../domain/cashier/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {OpenCashierDto, CashierDto, ListCashierDto, closeCashierSchema, getCashierSchema} from '../dtos';
import {OpenCashierService, CloseCashierService, GetCashierService, ListCashierService} from '../services';

@ApiTags('Cashier')
@Controller('cashier')
export class CashierController {
    constructor(
        private readonly openCashierService: OpenCashierService,
        private readonly getCashierService: GetCashierService,
        private readonly listCashierService: ListCashierService,
        private readonly closeCashierService: CloseCashierService
    ) {}

    @ApiOperation({
        summary: 'Opens a new cashier',
        responses: [
            {
                status: 201,
                description: 'Cashier opened',
                type: CashierDto,
            },
        ],
    })
    @Authorize(CashierPermission.OPEN)
    @Post()
    async openCashier(@RequestActor() actor: Actor, @Body() payload: OpenCashierDto): Promise<CashierDto> {
        return this.openCashierService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a cashier',
        parameters: [entityIdParam('Cashier ID')],
        responses: [
            {
                status: 200,
                description: 'Cashier found',
                type: CashierDto,
            },
        ],
    })
    @Authorize(CashierPermission.VIEW)
    @Get(':id')
    async getCashier(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getCashierSchema.shape.id) id: CashierId
    ): Promise<CashierDto> {
        return this.getCashierService.execute({actor, payload: {id}});
    }

    @ApiPaginatedOperation({
        summary: 'Finds cashiers',
        responses: [
            {
                status: 200,
                description: 'Cashiers found',
                model: CashierDto,
            },
        ],
    })
    @Authorize(CashierPermission.VIEW)
    @Get()
    async listCashier(
        @RequestActor() actor: Actor,
        @Query() payload: ListCashierDto
    ): Promise<PaginatedDto<CashierDto>> {
        return this.listCashierService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Closes a cashier',
        parameters: [entityIdParam('Cashier ID')],
        responses: [
            {
                status: 200,
                description: 'Cashier closed',
                type: CashierDto,
            },
        ],
    })
    @Authorize(CashierPermission.CLOSE)
    @Patch(':id')
    async closeCashier(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', closeCashierSchema.shape.id) id: CashierId
    ): Promise<CashierDto> {
        return this.closeCashierService.execute({actor, payload: {id}});
    }
}
