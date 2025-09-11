import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {AccountChangedEvent, AccountCreatedEvent, AccountDeletedEvent} from '../../events';
import type {CreateAccount} from '../account.entity';
import {Account, AccountId, AccountType} from '../account.entity';
import {fakeAccount} from './fake-account';

describe('An account', () => {
    const companyId = CompanyId.generate();
    const now = new Date(1000);

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit an account-created event', () => {
            const data: CreateAccount = {
                companyId,
                name: 'Account 1',
                type: AccountType.BANK,
                bankId: 123,
                agencyNumber: 1234,
                agencyDigit: 'x',
                accountDigit: '1',
                accountNumber: 1234,
            };

            const account = Account.create(data);

            expect(account.id).toBeInstanceOf(AccountId);
            expect(account.companyId).toBe(companyId);
            expect(account.name).toBe(data.name);
            expect(account.bankId).toBe(data.bankId);
            expect(account.agencyNumber).toBe(data.agencyNumber);
            expect(account.agencyDigit).toBe(data.agencyDigit);
            expect(account.accountDigit).toBe(data.accountDigit);
            expect(account.accountNumber).toBe(data.accountNumber);

            expect(account.events).toEqual([
                {
                    type: AccountCreatedEvent.type,
                    companyId,
                    account,
                    timestamp: now,
                },
            ]);
            expect(account.events[0]).toBeInstanceOf(AccountCreatedEvent);
        });

        it.each([
            [{name: ''}, 'Account name must be at least 1 character long.'],
            [{bankId: 250, agencyNumber: 1}, 'Internal accounts cannot have bank information.'],
        ])('should throw an error when receiving invalid data', (input, expectedError) => {
            const account: CreateAccount = {
                companyId,
                name: 'Account 1',
                type: AccountType.INTERNAL,
            };

            expect(() => Account.create({...account, ...input})).toThrowWithMessage(
                InvalidInputException,
                expectedError
            );
        });
    });

    describe('on change', () => {
        it('should emit an account-changed event', () => {
            const account = fakeAccount({
                companyId,
                type: AccountType.INTERNAL,
            });

            const oldAccount = fakeAccount(account);

            account.change({
                name: 'Account 2',
                bankId: 123,
                type: AccountType.BANK,
                agencyNumber: 1234,
                agencyDigit: '1',
                accountDigit: '1',
                accountNumber: 1234,
            });

            expect(account.name).toBe('Account 2');
            expect(account.bankId).toBe(123);
            expect(account.agencyNumber).toBe(1234);
            expect(account.agencyDigit).toBe('1');
            expect(account.accountDigit).toBe('1');
            expect(account.accountNumber).toBe(1234);

            expect(account.events).toEqual([
                {
                    type: AccountChangedEvent.type,
                    timestamp: now,
                    companyId,
                    oldState: oldAccount,
                    newState: account,
                },
            ]);

            expect(account.events[0]).toBeInstanceOf(AccountChangedEvent);
        });

        it.each([
            [{name: ''}, 'Account name must be at least 1 character long.'],
            [{bankId: 250, agencyNumber: 1}, 'Internal accounts cannot have bank information.'],
        ])('should throw an error when receiving invalid data', (payload, expectedError) => {
            const account = fakeAccount({
                companyId,
                type: AccountType.INTERNAL,
            });

            expect(() => account.change(payload)).toThrowWithMessage(InvalidInputException, expectedError);
        });
    });

    describe('on deletion', () => {
        it('should emit an account-deleted event', () => {
            const account = fakeAccount({companyId});

            account.delete();

            expect(account.events).toEqual([
                {
                    type: AccountDeletedEvent.type,
                    timestamp: now,
                    companyId,
                    account,
                },
            ]);

            expect(account.events[0]).toBeInstanceOf(AccountDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const account = fakeAccount({
            companyId,
            name: 'Account 1',
        });

        expect(account.toJSON()).toEqual({
            id: account.id.toString(),
            companyId: companyId.toJSON(),
            name: 'Account 1',
            type: account.type,
            bankId: account.bankId,
            agencyNumber: account.agencyNumber,
            agencyDigit: account.agencyDigit,
            accountDigit: account.agencyDigit,
            accountNumber: account.accountNumber,
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });
});

describe('An account ID', () => {
    it('can be created from a string', () => {
        const uuid = '0c64d1cb-764d-44eb-bb3a-973a854dd449';
        const id = AccountId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(AccountId.generate()).toBeInstanceOf(AccountId);
    });
});
