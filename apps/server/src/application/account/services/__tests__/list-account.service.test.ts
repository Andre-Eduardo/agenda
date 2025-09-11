import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {AccountRepository} from '../../../../domain/account/account.repository';
import type {Account} from '../../../../domain/account/entities';
import {fakeAccount} from '../../../../domain/account/entities/__tests__/fake-account';
import {CompanyId} from '../../../../domain/company/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListAccountDto} from '../../dtos';
import {AccountDto} from '../../dtos';
import {ListAccountService} from '../list-account.service';

describe('A list-account service', () => {
    const accountRepository = mock<AccountRepository>();
    const listAccountService = new ListAccountService(accountRepository);

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const existingAccount = [fakeAccount({companyId}), fakeAccount({companyId})];

    it('should list accounts', async () => {
        const paginatedAccounts: PaginatedList<Account> = {
            data: existingAccount,
            totalCount: existingAccount.length,
            nextCursor: null,
        };

        const payload: ListAccountDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
            name: 'name',
        };

        jest.spyOn(accountRepository, 'search').mockResolvedValueOnce(paginatedAccounts);

        await expect(listAccountService.execute({actor, payload})).resolves.toEqual({
            data: existingAccount.map((account) => new AccountDto(account)),
            totalCount: existingAccount.length,
            nextCursor: null,
        });
        expect(existingAccount.flatMap((account) => account.events)).toHaveLength(0);

        expect(accountRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'name',
            }
        );
    });

    it('should paginate accounts', async () => {
        const paginatedAccounts: PaginatedList<Account> = {
            data: existingAccount,
            totalCount: existingAccount.length,
            nextCursor: null,
        };

        const payload: ListAccountDto = {
            companyId,
            name: 'name',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(accountRepository, 'search').mockResolvedValueOnce(paginatedAccounts);

        await expect(listAccountService.execute({actor, payload})).resolves.toEqual({
            data: existingAccount.map((account) => new AccountDto(account)),
            totalCount: existingAccount.length,
            nextCursor: null,
        });

        expect(existingAccount.flatMap((account) => account.events)).toHaveLength(0);

        expect(accountRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                name: 'name',
            }
        );
    });
});
