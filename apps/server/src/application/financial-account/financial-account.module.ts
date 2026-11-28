import {Module} from '@nestjs/common';
import {FinancialAccountController} from '@application/financial-account/controllers';
import {
    CreateFinancialAccountService,
    GetAccountStatementService,
    ListFinancialAccountsService,
    UpdateFinancialAccountService,
} from '@application/financial-account/services';
import {AppointmentLedger} from '@domain/financial-entry/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [FinancialAccountController],
    providers: [
        AppointmentLedger,
        ListFinancialAccountsService,
        CreateFinancialAccountService,
        UpdateFinancialAccountService,
        GetAccountStatementService,
    ],
})
export class FinancialAccountModule {}
