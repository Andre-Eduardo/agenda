import {CompanyId} from '../../../company/entities';
import {UserId} from '../../../user/entities';
import {CashierClosedEvent, CashierOpenedEvent} from '../../events';
import {Cashier, CashierId} from '../cashier.entity';
import {fakeCashier} from './fake-cashier';

describe('A cashier', () => {
    const companyId = CompanyId.generate();
    const now = new Date();
    const userId = UserId.generate();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on opening', () => {
        it('should emit a cashier-opened event', () => {
            const cashier = Cashier.open({
                companyId,
                userId: UserId.generate(),
            });

            expect(cashier.companyId).toEqual(companyId);
            expect(cashier.userId).toEqual(cashier.userId);
            expect(cashier.createdAt).toEqual(now);
            expect(cashier.updatedAt).toEqual(now);
            expect(cashier.closedAt).toBeNull();

            expect(cashier.events).toEqual([
                {
                    type: CashierOpenedEvent.type,
                    companyId,
                    cashier,
                    timestamp: now,
                },
            ]);
            expect(cashier.events[0]).toBeInstanceOf(CashierOpenedEvent);
        });
    });

    describe('on closing', () => {
        it('should emit a cashier-closed event', () => {
            const cashier = fakeCashier({companyId, userId, createdAt: now, updatedAt: now, closedAt: now});

            cashier.close();

            expect(cashier.companyId).toEqual(companyId);
            expect(cashier.userId).toEqual(userId);
            expect(cashier.createdAt).toEqual(now);
            expect(cashier.updatedAt).toEqual(now);
            expect(cashier.closedAt).toEqual(now);

            expect(cashier.events).toEqual([
                {
                    type: CashierClosedEvent.type,
                    companyId,
                    timestamp: now,
                    cashier,
                },
            ]);
            expect(cashier.events[0]).toBeInstanceOf(CashierClosedEvent);
        });
    });

    it('should be serializable', () => {
        const cashier = fakeCashier({companyId});

        expect(cashier.toJSON()).toEqual({
            companyId: cashier.companyId.toJSON(),
            id: cashier.id.toJSON(),
            userId: cashier.userId.toJSON(),
            createdAt: cashier.createdAt.toJSON(),
            updatedAt: cashier.updatedAt.toJSON(),
            closedAt: null,
        });
    });
});

describe('A cashier ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = CashierId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(CashierId.generate()).toBeInstanceOf(CashierId);
    });
});
