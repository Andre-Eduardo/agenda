import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {AccountId} from '../../../domain/account/entities';
import {AccountPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    AccountDto,
    CreateAccountDto,
    deleteAccountSchema,
    getAccountSchema,
    ListAccountDto,
    UpdateAccountInputDto,
    updateAccountSchema,
} from '../dtos';
import {
    CreateAccountService,
    DeleteAccountService,
    GetAccountService,
    ListAccountService,
    UpdateAccountService,
} from '../services';

@ApiTags('Account')
@Controller('account')
export class AccountController {
    constructor(
        private readonly createAccountService: CreateAccountService,
        private readonly listAccountService: ListAccountService,
        private readonly getAccountService: GetAccountService,
        private readonly updateAccountService: UpdateAccountService,
        private readonly deleteAccountService: DeleteAccountService
    ) {}

    @ApiOperation({
        summary: 'Creates a new account',
        responses: [
            {
                status: 201,
                description: 'Account created',
                type: AccountDto,
            },
        ],
    })
    @Authorize(AccountPermission.CREATE)
    @Post()
    async createAccount(@RequestActor() actor: Actor, @Body() payload: CreateAccountDto): Promise<AccountDto> {
        return this.createAccountService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets an account',
        parameters: [entityIdParam('Account ID')],
        responses: [
            {
                status: 200,
                description: 'Account found',
                type: AccountDto,
            },
        ],
    })
    @Authorize(AccountPermission.VIEW)
    @Get(':id')
    async getAccount(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getAccountSchema.shape.id) id: AccountId
    ): Promise<AccountDto> {
        return this.getAccountService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Lists accounts',
        responses: [
            {
                status: 200,
                description: 'Accounts found',
                type: AccountDto,
            },
        ],
    })
    @Authorize(AccountPermission.VIEW)
    @Get()
    async listAccount(
        @RequestActor() actor: Actor,
        @Query() payload: ListAccountDto
    ): Promise<PaginatedDto<AccountDto>> {
        return this.listAccountService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates an account',
        parameters: [entityIdParam('Account ID')],
        responses: [
            {
                status: 200,
                description: 'Account updated',
                type: AccountDto,
            },
        ],
    })
    @Authorize(AccountPermission.UPDATE)
    @Put(':id')
    async updateAccount(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateAccountSchema.shape.id) id: AccountId,
        @Body() payload: UpdateAccountInputDto
    ): Promise<AccountDto> {
        return this.updateAccountService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes an account',
        parameters: [entityIdParam('Account ID')],
        responses: [
            {
                status: 200,
                description: 'Account deleted',
            },
        ],
    })
    @Authorize(AccountPermission.DELETE)
    @Delete(':id')
    async deleteAccount(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteAccountSchema.shape.id) id: AccountId
    ): Promise<void> {
        await this.deleteAccountService.execute({actor, payload: {id}});
    }
}
