import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import {PaymentMethodChangedEvent, PaymentMethodCreatedEvent, PaymentMethodDeletedEvent} from '../events';

export type PaymentMethodProps = EntityProps<PaymentMethod>;
export type CreatePaymentMethod = CreateEntity<PaymentMethod>;
export type UpdatePaymentMethod = Omit<Partial<PaymentMethodProps>, 'companyId'>;

export enum PaymentMethodType {
    CASH = 'CASH',
    PIX = 'PIX',
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    PAWN = 'PAWN',
    OTHER = 'OTHER',
}

export class PaymentMethod extends AggregateRoot<PaymentMethodId> {
    companyId: CompanyId;
    name: string;
    type: PaymentMethodType;

    constructor(props: AllEntityProps<PaymentMethod>) {
        super(props);
        this.companyId = props.companyId;
        this.name = props.name;
        this.type = props.type;
        this.validate();
    }

    static create(props: CreatePaymentMethod): PaymentMethod {
        const paymentMethodId = PaymentMethodId.generate();
        const now = new Date();

        const paymentMethod = new PaymentMethod({
            ...props,
            id: paymentMethodId,
            name: props.name,
            type: props.type,
            createdAt: now,
            updatedAt: now,
        });

        paymentMethod.addEvent(
            new PaymentMethodCreatedEvent({companyId: props.companyId, paymentMethod, timestamp: now})
        );

        return paymentMethod;
    }

    change(props: UpdatePaymentMethod): void {
        const oldPaymentMethod = new PaymentMethod(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        if (props.type !== undefined) {
            this.type = props.type;
        }

        this.addEvent(
            new PaymentMethodChangedEvent({
                companyId: this.companyId,
                oldState: oldPaymentMethod,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new PaymentMethodDeletedEvent({companyId: this.companyId, paymentMethod: this}));
    }

    toJSON(): EntityJson<PaymentMethod> {
        return {
            id: this.id.toJSON(),
            name: this.name,
            type: this.type,
            companyId: this.companyId.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof PaymentMethodProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Payment method name must be at least 1 character long.');
            }
        }
    }
}

export class PaymentMethodId extends EntityId<'PaymentMethodId'> {
    static from(value: string): PaymentMethodId {
        return new PaymentMethodId(value);
    }

    static generate(): PaymentMethodId {
        return new PaymentMethodId();
    }
}
