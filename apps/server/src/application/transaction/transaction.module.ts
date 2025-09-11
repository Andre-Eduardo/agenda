import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {TransactionController} from './controllers';
import {
    CreateTransactionService,
    GetTransactionService,
    ListTransactionService,
    UpdateTransactionService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [TransactionController],
    providers: [CreateTransactionService, UpdateTransactionService, ListTransactionService, GetTransactionService],
})
export class TransactionModule {}
