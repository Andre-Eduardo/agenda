import {CompanyId} from '../../../company/entities';
import {Account, AccountId, AccountType} from '../index';

export function fakeAccount(payload: Partial<Account> = {}): Account {
    return new Account({
        id: AccountId.generate(),
        name: 'Account',
        type: AccountType.INTERNAL,
        accountNumber: null,
        agencyDigit: null,
        agencyNumber: null,
        accountDigit: null,
        bankId: null,
        companyId: CompanyId.generate(),
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
