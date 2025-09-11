import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {AccountRepository} from '../../../../domain/account/account.repository';
import {AccountId} from '../../../../domain/account/entities';
import {fakeAccount} from '../../../../domain/account/entities/__tests__/fake-account';
import {AccountDeletedEvent} from '../../../../domain/account/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteAccountDto} from '../../dtos';
import {DeleteAccountService} from '../delete-account.service';

describe('A delete-account service', () => {
    const accountRepository = mock<AccountRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteAccountService = new DeleteAccountService(accountRepository, eventDispatcher);

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

    it('should delete an account', async () => {
        const existingAccount = fakeAccount();

        const payload: DeleteAccountDto = {
            id: existingAccount.id,
        };

        jest.spyOn(accountRepository, 'findById').mockResolvedValueOnce(existingAccount);

        await deleteAccountService.execute({actor, payload});

        expect(existingAccount.events).toHaveLength(1);
        expect(existingAccount.events[0]).toBeInstanceOf(AccountDeletedEvent);
        expect(existingAccount.events).toEqual([
            {
                type: AccountDeletedEvent.type,
                account: existingAccount,
                companyId: existingAccount.companyId,
                timestamp: now,
            },
        ]);
        expect(accountRepository.delete).toHaveBeenCalledWith(existingAccount.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingAccount);
    });

    it('should throw an error when the account does not exist', async () => {
        const payload: DeleteAccountDto = {
            id: AccountId.generate(),
        };

        jest.spyOn(accountRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteAccountService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Account not found'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
