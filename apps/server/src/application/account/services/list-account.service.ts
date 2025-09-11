import {Injectable} from '@nestjs/common';
import {AccountRepository} from '../../../domain/account/account.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {AccountDto, ListAccountDto} from '../dtos';

@Injectable()
export class ListAccountService implements ApplicationService<ListAccountDto, PaginatedDto<AccountDto>> {
    constructor(private readonly accountRepository: AccountRepository) {}

    async execute({payload}: Command<ListAccountDto>): Promise<PaginatedDto<AccountDto>> {
        const result = await this.accountRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                type: payload.type,
            }
        );

        return {
            ...result,
            data: result.data.map((account) => new AccountDto(account)),
        };
    }
}
