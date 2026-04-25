import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {SubscriptionModule} from '../subscription/subscription.module';
import {ImportedDocumentController} from './controllers/imported-document.controller';
import {ApproveDraftService, GetOrCreateDraftService, UpdateDraftService} from './services';

@Module({
    imports: [InfrastructureModule, SubscriptionModule],
    controllers: [ImportedDocumentController],
    providers: [GetOrCreateDraftService, UpdateDraftService, ApproveDraftService],
})
export class ImportedDocumentModule {}
