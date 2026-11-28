import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {AppointmentPaymentDto} from '@application/appointment-payment/dtos/appointment-payment.dto';
import {brlFromCents} from '@domain/appointment-payment/brl';
import {PaymentMethod} from '@domain/appointment-payment/entities';
import type {AppointmentPayment} from '@domain/appointment-payment/entities';
import type {FinancialAccount} from '@domain/financial-account/entities';
import {AccountMovementCategory, AccountMovementDirection} from '@domain/financial-entry/entities';
import type {AccountMovement, FinancialEntry} from '@domain/financial-entry/entities';

@ApiSchema({name: 'AccountMovement'})
export class AccountMovementDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty({format: 'uuid'})
    entryId: string;

    @ApiProperty({format: 'uuid'})
    accountId: string;

    @ApiProperty({type: 'string', nullable: true, description: 'Account name, when the account is known'})
    accountName: string | null;

    @ApiProperty({enum: AccountMovementDirection, enumName: 'AccountMovementDirection'})
    direction: AccountMovementDirection;

    @ApiProperty({enum: AccountMovementCategory, enumName: 'AccountMovementCategory'})
    category: AccountMovementCategory;

    @ApiProperty({enum: PaymentMethod, enumName: 'PaymentMethod'})
    paymentMethod: PaymentMethod;

    @ApiProperty({description: 'Always positive; direction says whether it came in or went out'})
    amountBrl: number;

    @ApiProperty({format: 'date-time'})
    movedAt: string;

    @ApiProperty({type: 'string', nullable: true})
    reason: string | null;

    @ApiProperty({type: 'string', format: 'uuid', nullable: true})
    reversesMovementId: string | null;

    @ApiProperty({format: 'uuid'})
    responsibleMemberId: string;

    constructor(movement: AccountMovement, accountName: string | null) {
        this.id = movement.id.toString();
        this.entryId = movement.entryId.toString();
        this.accountId = movement.accountId.toString();
        this.accountName = accountName;
        this.direction = movement.direction;
        this.category = movement.category;
        this.paymentMethod = movement.paymentMethod;
        this.amountBrl = brlFromCents(movement.amountCents);
        this.movedAt = movement.movedAt.toISOString();
        this.reason = movement.reason;
        this.reversesMovementId = movement.reversesMovementId?.toString() ?? null;
        this.responsibleMemberId = movement.responsibleMemberId.toString();
    }
}

@ApiSchema({name: 'AppointmentPaymentLedger'})
export class AppointmentPaymentLedgerDto {
    @ApiProperty({type: AppointmentPaymentDto})
    payment: AppointmentPaymentDto;

    @ApiProperty({description: 'Whether the payment uses the ledger (methods that move money)'})
    tracked: boolean;

    @ApiProperty()
    amountBrl: number;

    @ApiProperty({description: 'Received, net of refunds'})
    receivedBrl: number;

    @ApiProperty()
    remainingBrl: number;

    @ApiProperty({type: [AccountMovementDto]})
    movements: AccountMovementDto[];

    constructor(payment: AppointmentPayment, entry: FinancialEntry | null, accounts: FinancialAccount[]) {
        const names = new Map(accounts.map((account) => [account.id.toString(), account.name]));

        this.payment = new AppointmentPaymentDto(payment);
        this.tracked = entry !== null;
        this.amountBrl = entry === null ? payment.amountBrl : brlFromCents(entry.amountCents);
        this.receivedBrl = entry === null ? 0 : brlFromCents(entry.receivedCents());
        this.remainingBrl = entry === null ? 0 : brlFromCents(entry.remainingCents());
        this.movements = (entry?.movements ?? []).map(
            (movement) => new AccountMovementDto(movement, names.get(movement.accountId.toString()) ?? null)
        );
    }
}
