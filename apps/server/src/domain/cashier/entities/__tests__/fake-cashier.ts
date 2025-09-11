import {CompanyId} from '../../../company/entities';
import {UserId} from '../../../user/entities';
import {Cashier, CashierId} from '../index';

export function fakeCashier(payload: Partial<Cashier> = {}): Cashier {
    return new Cashier({
        id: CashierId.generate(),
        companyId: CompanyId.generate(),
        userId: UserId.generate(),
        closedAt: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
