import type {AllEntityProps, CreateEntity, EntityJson} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {CompanyId} from '../../company/entities';
import type {UserId} from '../../user/entities';
import {CashierClosedEvent, CashierOpenedEvent} from '../events';

export type OpenCashier = Omit<CreateEntity<Cashier>, 'closedAt'>;

export class Cashier extends AggregateRoot<CashierId> {
    companyId: CompanyId;
    userId: UserId;
    closedAt: Date | null;

    constructor(props: AllEntityProps<Cashier>) {
        super(props);
        this.companyId = props.companyId;
        this.userId = props.userId;
        this.closedAt = props.closedAt;
    }

    static open(props: OpenCashier): Cashier {
        const cashierId = CashierId.generate();
        const now = new Date();

        const cashier = new Cashier({
            ...props,
            id: cashierId,
            createdAt: now,
            updatedAt: now,
            closedAt: null,
        });

        cashier.addEvent(new CashierOpenedEvent({companyId: props.companyId, cashier, timestamp: now}));

        return cashier;
    }

    close(): void {
        this.closedAt = new Date();
        this.addEvent(new CashierClosedEvent({companyId: this.companyId, cashier: this}));
    }

    toJSON(): EntityJson<Cashier> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            userId: this.userId.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            closedAt: this.closedAt?.toJSON() ?? null,
        };
    }
}

export class CashierId extends EntityId<'CashierId'> {
    static from(value: string): CashierId {
        return new CashierId(value);
    }

    static generate(): CashierId {
        return new CashierId();
    }
}
