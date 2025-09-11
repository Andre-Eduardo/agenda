import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {AccountRepository} from '../../../../domain/account/account.repository';
import {AccountId} from '../../../../domain/account/entities';
import {fakeAccount} from '../../../../domain/account/entities/__tests__/fake-account';
import {UserId} from '../../../../domain/user/entities';
import type {GetAccountDto} from '../../dtos';
import {AccountDto} from '../../dtos';
import {GetAccountService} from '../get-account.service';

describe('A get-account service', () => {
    const accountRepository = mock<AccountRepository>();
    const getAccountService = new GetAccountService(accountRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get an account', async () => {
        const existingAccount = fakeAccount();

        const payload: GetAccountDto = {
            id: existingAccount.id,
        };

        jest.spyOn(accountRepository, 'findById').mockResolvedValueOnce(existingAccount);

        await expect(getAccountService.execute({actor, payload})).resolves.toEqual(new AccountDto(existingAccount));

        expect(existingAccount.events).toHaveLength(0);

        expect(accountRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the account does not exist', async () => {
        const payload: GetAccountDto = {
            id: AccountId.generate(),
        };

        jest.spyOn(accountRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getAccountService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Account not found'
        );
    });
});
