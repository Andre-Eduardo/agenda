import type {Actor} from '@domain/@shared/actor';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {FinancialAccountExceptions} from '@domain/financial-account/entities';
import type {FinancialAccount, FinancialAccountId} from '@domain/financial-account/entities';
import type {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';

export async function loadFinancialAccount(
    repository: FinancialAccountRepository,
    actor: Actor,
    id: FinancialAccountId
): Promise<FinancialAccount> {
    const account = await repository.findById(id);

    // Conta de outra clínica responde como inexistente.
    if (account === null || !account.clinicId.equals(actor.clinicId)) {
        throw new ResourceNotFoundException(FinancialAccountExceptions.not_found, id.toString());
    }

    return account;
}
