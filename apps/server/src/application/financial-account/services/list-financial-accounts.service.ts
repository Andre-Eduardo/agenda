import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {FinancialAccountDto} from '@application/financial-account/dtos';
import {FinancialAccountType} from '@domain/financial-account/entities';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';
import {AppointmentLedger} from '@domain/financial-entry/services';

/** Contas da clínica com saldo. Garante as contas padrão de caixa, banco e maquininha. */
@Injectable()
export class ListFinancialAccountsService implements ApplicationService<void, FinancialAccountDto[]> {
    constructor(
        private readonly financialAccountRepository: FinancialAccountRepository,
        private readonly appointmentLedger: AppointmentLedger
    ) {}

    async execute({actor}: Command<void>): Promise<FinancialAccountDto[]> {
        for (const type of [
            FinancialAccountType.CASH_DRAWER,
            FinancialAccountType.BANK,
            FinancialAccountType.CARD_MACHINE,
        ]) {
            await this.appointmentLedger.defaultAccount(actor.clinicId, type);
        }

        const [accounts, balances] = await Promise.all([
            this.financialAccountRepository.findByClinicId(actor.clinicId),
            this.financialAccountRepository.balances(actor.clinicId),
        ]);

        return accounts.map((account) => new FinancialAccountDto(account, balances.get(account.id.toString()) ?? 0));
    }
}
