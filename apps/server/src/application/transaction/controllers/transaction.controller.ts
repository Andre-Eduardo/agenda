import {Body, Controller, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {TransactionPermission} from '../../../domain/auth';
import {TransactionId} from '../../../domain/transaction/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    TransactionDto,
    CreateTransactionDto,
    ListTransactionDto,
    UpdateTransactionInputDto,
    getTransactionSchema,
    updateTransactionSchema,
} from '../dtos';
import {
    CreateTransactionService,
    GetTransactionService,
    ListTransactionService,
    UpdateTransactionService,
} from '../services';

@ApiTags('Transaction')
@Controller('transaction')
export class TransactionController {
    constructor(
        private readonly createTransactionService: CreateTransactionService,
        private readonly getTransactionService: GetTransactionService,
        private readonly listTransactionService: ListTransactionService,
        private readonly updateCompanyService: UpdateTransactionService
    ) {}

    @ApiOperation({
        summary: 'Creates a new transaction',
        responses: [
            {
                status: 201,
                description: 'Transaction created',
                type: TransactionDto,
            },
        ],
    })
    @Authorize(TransactionPermission.CREATE)
    @Post()
    async createTransaction(
        @RequestActor() actor: Actor,
        @Body() payload: CreateTransactionDto
    ): Promise<TransactionDto> {
        return this.createTransactionService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a transaction',
        parameters: [entityIdParam('Transaction ID')],
        responses: [
            {
                status: 200,
                description: 'Transaction found',
                type: TransactionDto,
            },
        ],
    })
    @Authorize(TransactionPermission.VIEW)
    @Get(':id')
    async getTransaction(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getTransactionSchema.shape.id) id: TransactionId
    ): Promise<TransactionDto> {
        return this.getTransactionService.execute({actor, payload: {id}});
    }

    @ApiPaginatedOperation({
        summary: 'Finds transactions',
        responses: [
            {
                status: 200,
                description: 'Transactions found',
                model: TransactionDto,
            },
        ],
    })
    @Authorize(TransactionPermission.VIEW)
    @Get()
    async listTransaction(
        @RequestActor() actor: Actor,
        @Query() payload: ListTransactionDto
    ): Promise<PaginatedDto<TransactionDto>> {
        return this.listTransactionService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a Transaction',
        parameters: [entityIdParam('Transaction ID')],
        responses: [
            {
                status: 200,
                description: 'Transaction updated',
                type: TransactionDto,
            },
        ],
    })
    @Authorize(TransactionPermission.UPDATE)
    @Put(':id')
    async updateTransaction(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateTransactionSchema.shape.id) id: TransactionId,
        @Body() payload: UpdateTransactionInputDto
    ): Promise<TransactionDto> {
        return this.updateCompanyService.execute({actor, payload: {id, ...payload}});
    }
}
