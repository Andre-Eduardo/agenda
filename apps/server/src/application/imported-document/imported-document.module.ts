import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ImportedDocumentController} from './controllers/imported-document.controller';
import {ApproveDraftService, GetOrCreateDraftService, UpdateDraftService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ImportedDocumentController],
    providers: [GetOrCreateDraftService, UpdateDraftService, ApproveDraftService],
})
export class ImportedDocumentModule {}
