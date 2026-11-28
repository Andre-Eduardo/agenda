import type {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {FinancialAccountId} from '@domain/financial-account/entities';
import type {AccountMovement, FinancialEntry} from '@domain/financial-entry/entities';

export type AccountStatementFilter = {
    clinicId: ClinicId;
    accountId: FinancialAccountId;
    from?: Date | null;
    to?: Date | null;
};

export interface FinancialEntryRepository {
    findByAppointmentPaymentId(appointmentPaymentId: AppointmentPaymentId): Promise<FinancialEntry | null>;
    /** Saves the entry and appends its new movements. Movements already stored are never touched. */
    save(entry: FinancialEntry): Promise<void>;
    /** Extrato de uma conta, mais recente primeiro. */
    listMovements(
        filter: AccountStatementFilter,
        page: number,
        pageSize: number
    ): Promise<{data: AccountMovement[]; total: number}>;
}

export abstract class FinancialEntryRepository {}
