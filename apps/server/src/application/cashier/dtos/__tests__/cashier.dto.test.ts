import type {OpenCashier} from '../../../../domain/cashier/entities';
import {Cashier} from '../../../../domain/cashier/entities';
import {CompanyId} from '../../../../domain/company/entities';
import {UserId} from '../../../../domain/user/entities';
import {CashierDto} from '../cashier.dto';

describe('A CashierDto', () => {
    it('should be creatable from a cashier entity', () => {
        const cashierPayload: OpenCashier = {
            companyId: CompanyId.generate(),
            userId: UserId.generate(),
        };

        const cashier = Cashier.open(cashierPayload);
        const cashierDto = new CashierDto(cashier);

        expect(cashierDto.userId).toEqual(cashierPayload.userId.toString());
    });
});
