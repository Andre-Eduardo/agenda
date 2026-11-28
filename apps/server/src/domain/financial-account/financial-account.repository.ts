import type {ClinicId} from '@domain/clinic/entities';
import type {FinancialAccount, FinancialAccountId, FinancialAccountType} from '@domain/financial-account/entities';

export interface FinancialAccountRepository {
    findById(id: FinancialAccountId): Promise<FinancialAccount | null>;
    findByClinicId(clinicId: ClinicId): Promise<FinancialAccount[]>;
    findDefault(clinicId: ClinicId, type: FinancialAccountType): Promise<FinancialAccount | null>;
    /** Saldo em centavos por conta (entradas menos saídas). Contas sem movimento ficam com zero. */
    balances(clinicId: ClinicId): Promise<Map<string, number>>;
    save(account: FinancialAccount): Promise<void>;
}

export abstract class FinancialAccountRepository {}
