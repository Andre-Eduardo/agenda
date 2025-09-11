import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {AccountController} from './controllers';
import {
    CreateAccountService,
    DeleteAccountService,
    GetAccountService,
    ListAccountService,
    UpdateAccountService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [AccountController],
    providers: [
        CreateAccountService,
        ListAccountService,
        GetAccountService,
        UpdateAccountService,
        DeleteAccountService,
    ],
})
export class AccountModule {}
