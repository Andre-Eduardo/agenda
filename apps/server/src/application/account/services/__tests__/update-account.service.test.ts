import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {AccountRepository} from '../../../../domain/account/account.repository';
import {AccountId} from '../../../../domain/account/entities';
import {fakeAccount} from '../../../../domain/account/entities/__tests__/fake-account';
import {AccountChangedEvent} from '../../../../domain/account/events';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateAccountDto} from '../../dtos';
import {AccountDto} from '../../dtos';
import {UpdateAccountService} from '../update-account.service';

describe('A update-account service', () => {
    const accountRepository = mock<AccountRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateAccountService = new UpdateAccountService(accountRepository, eventDispatcher);

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should update an account', async () => {
        const existingAccount = fakeAccount({
            id: AccountId.generate(),
            companyId,
        });

        const oldAccount = fakeAccount(existingAccount);

        const payload: UpdateAccountDto = {
            id: existingAccount.id,
            name: 'New name',
        };

        jest.spyOn(accountRepository, 'findById').mockResolvedValueOnce(existingAccount);

        const updatedAccount = fakeAccount({
            ...existingAccount,
            ...payload,
            updatedAt: now,
        });

        await expect(updateAccountService.execute({actor, payload})).resolves.toEqual(new AccountDto(updatedAccount));

        expect(existingAccount.name).toBe(payload.name);
        expect(existingAccount.updatedAt).toEqual(now);
        expect(existingAccount.events).toHaveLength(1);
        expect(existingAccount.events[0]).toBeInstanceOf(AccountChangedEvent);
        expect(existingAccount.events).toEqual([
            {
                type: AccountChangedEvent.type,
                companyId,
                timestamp: now,
                oldState: oldAccount,
                newState: existingAccount,
            },
        ]);
        expect(accountRepository.save).toHaveBeenCalledWith(existingAccount);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingAccount);
    });

    it('should throw an error when the account does not exist', async () => {
        const payload: UpdateAccountDto = {
            id: AccountId.generate(),
            name: 'New name',
        };

        jest.spyOn(accountRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateAccountService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Account not found'
        );
    });
});
