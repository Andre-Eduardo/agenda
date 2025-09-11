import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {AccountRepository} from '../../../../domain/account/account.repository';
import {Account, AccountType} from '../../../../domain/account/entities';
import {AccountCreatedEvent} from '../../../../domain/account/events';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {CreateAccountDto} from '../../dtos';
import {AccountDto} from '../../dtos';
import {CreateAccountService} from '../create-account.service';

describe('A create-account service', () => {
    const accountRepository = mock<AccountRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createAccountService = new CreateAccountService(accountRepository, eventDispatcher);

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

    it('should create an account', async () => {
        const payload: CreateAccountDto = {
            companyId,
            name: 'account',
            type: AccountType.INTERNAL,
        };

        const account = Account.create({
            companyId,
            name: 'account',
            type: AccountType.INTERNAL,
        });

        jest.spyOn(Account, 'create').mockReturnValue(account);

        await expect(createAccountService.execute({actor, payload})).resolves.toEqual(new AccountDto(account));

        expect(Account.create).toHaveBeenCalledWith(payload);

        expect(account.events[0]).toBeInstanceOf(AccountCreatedEvent);
        expect(account.events).toEqual([
            {
                type: AccountCreatedEvent.type,
                account,
                companyId,
                timestamp: now,
            },
        ]);

        expect(accountRepository.save).toHaveBeenCalledWith(account);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, account);
    });
});
