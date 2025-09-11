import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {Account, AccountId, AccountType} from '../../../../domain/account/entities';
import {fakeAccount} from '../../../../domain/account/entities/__tests__/fake-account';
import {CompanyId} from '../../../../domain/company/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {CreateAccountDto} from '../../dtos';
import {AccountDto} from '../../dtos';
import type {
    CreateAccountService,
    DeleteAccountService,
    GetAccountService,
    ListAccountService,
    UpdateAccountService,
} from '../../services';
import {AccountController} from '../account.controller';

describe('An account controller', () => {
    const createAccountServiceMock = mock<CreateAccountService>();
    const listAccountServiceMock = mock<ListAccountService>();
    const getAccountServiceMock = mock<GetAccountService>();
    const updateAccountServiceMock = mock<UpdateAccountService>();
    const deleteAccountServiceMock = mock<DeleteAccountService>();
    const accountController = new AccountController(
        createAccountServiceMock,
        listAccountServiceMock,
        getAccountServiceMock,
        updateAccountServiceMock,
        deleteAccountServiceMock
    );

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating an account', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: CreateAccountDto = {
                companyId,
                name: 'Account 101',
                type: AccountType.INTERNAL,
            };

            const expectedAccount = new AccountDto(Account.create(payload));

            jest.spyOn(createAccountServiceMock, 'execute').mockResolvedValueOnce(expectedAccount);

            await expect(accountController.createAccount(actor, payload)).resolves.toEqual(expectedAccount);

            expect(createAccountServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(listAccountServiceMock.execute).not.toHaveBeenCalled();
            expect(getAccountServiceMock.execute).not.toHaveBeenCalled();
            expect(updateAccountServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteAccountServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing accounts', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                pagination: {
                    limit: 2,
                },
            };

            const accounts = [fakeAccount(), fakeAccount()];

            const expectedAccount: PaginatedDto<AccountDto> = {
                data: accounts.map((account) => new AccountDto(account)),
                totalCount: 2,
                nextCursor: 'nextCursor',
            };

            jest.spyOn(listAccountServiceMock, 'execute').mockResolvedValue(expectedAccount);

            await expect(accountController.listAccount(actor, payload)).resolves.toEqual(expectedAccount);

            expect(listAccountServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting an account', () => {
        it('should repass the responsibility to the right service', async () => {
            const account = fakeAccount();

            const expectedAccount = new AccountDto(account);

            jest.spyOn(getAccountServiceMock, 'execute').mockResolvedValue(expectedAccount);

            await expect(accountController.getAccount(actor, account.id)).resolves.toEqual(expectedAccount);

            expect(getAccountServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: account.id}});
        });
    });

    describe('when updating an account', () => {
        it('should repass the responsibility to the right service', async () => {
            const account = fakeAccount();

            const payload = {
                name: 'Account 102',
            };

            const existingAccount = new AccountDto(account);

            jest.spyOn(updateAccountServiceMock, 'execute').mockResolvedValueOnce(existingAccount);

            await expect(accountController.updateAccount(actor, account.id, payload)).resolves.toEqual(existingAccount);

            expect(updateAccountServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: account.id, ...payload},
            });
        });
    });

    describe('when deleting an account', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = AccountId.generate();

            await accountController.deleteAccount(actor, id);

            expect(deleteAccountServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
