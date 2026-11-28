import {Body, Controller, Get, Patch, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Authorize} from '@application/@shared/auth';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam} from '@application/@shared/validation';
import {entityId} from '@application/@shared/validation/schemas';
import {
    AccountStatementDto,
    CreateFinancialAccountDto,
    FinancialAccountDto,
    GetAccountStatementDto,
    UpdateFinancialAccountDto,
} from '@application/financial-account/dtos';
import {
    CreateFinancialAccountService,
    GetAccountStatementService,
    ListFinancialAccountsService,
    UpdateFinancialAccountService,
} from '@application/financial-account/services';
import {Actor} from '@domain/@shared/actor';
import {FinancialAccountPermission} from '@domain/auth';
import {FinancialAccountId} from '@domain/financial-account/entities';

const accountIdSchema = entityId(FinancialAccountId);

@ApiTags('Financial Account')
@Controller('financial-accounts')
export class FinancialAccountController {
    constructor(
        private readonly listFinancialAccountsService: ListFinancialAccountsService,
        private readonly createFinancialAccountService: CreateFinancialAccountService,
        private readonly updateFinancialAccountService: UpdateFinancialAccountService,
        private readonly getAccountStatementService: GetAccountStatementService
    ) {}

    @ApiOperation({
        summary: 'Lists the clinic accounts (cash drawer, bank, card machine) with their balance',
        responses: [{status: 200, description: 'Accounts', type: [FinancialAccountDto]}],
    })
    @Authorize(FinancialAccountPermission.VIEW)
    @Get()
    listFinancialAccounts(@RequestActor() actor: Actor): Promise<FinancialAccountDto[]> {
        return this.listFinancialAccountsService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Creates an account for the current clinic',
        responses: [{status: 201, description: 'Account created', type: FinancialAccountDto}],
    })
    @Authorize(FinancialAccountPermission.MANAGE)
    @Post()
    createFinancialAccount(
        @RequestActor() actor: Actor,
        @Body() payload: CreateFinancialAccountDto
    ): Promise<FinancialAccountDto> {
        return this.createFinancialAccountService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Renames or deactivates an account',
        parameters: [entityIdParam('Account ID', 'accountId')],
        responses: [
            {status: 200, description: 'Account updated', type: FinancialAccountDto},
            {status: 409, description: 'A default account cannot be deactivated'},
        ],
    })
    @Authorize(FinancialAccountPermission.MANAGE)
    @Patch(':accountId')
    updateFinancialAccount(
        @RequestActor() actor: Actor,
        @ValidatedParam('accountId', accountIdSchema) accountId: FinancialAccountId,
        @Body() payload: UpdateFinancialAccountDto
    ): Promise<FinancialAccountDto> {
        return this.updateFinancialAccountService.execute({actor, payload: {...payload, id: accountId}});
    }

    @ApiOperation({
        summary: 'Gets the statement of an account (newest first)',
        parameters: [entityIdParam('Account ID', 'accountId')],
        responses: [{status: 200, description: 'Account statement', type: AccountStatementDto}],
    })
    @Authorize(FinancialAccountPermission.VIEW)
    @Get(':accountId/statement')
    getAccountStatement(
        @RequestActor() actor: Actor,
        @ValidatedParam('accountId', accountIdSchema) accountId: FinancialAccountId,
        @Query() query: GetAccountStatementDto
    ): Promise<AccountStatementDto> {
        return this.getAccountStatementService.execute({actor, payload: {...query, id: accountId}});
    }
}
