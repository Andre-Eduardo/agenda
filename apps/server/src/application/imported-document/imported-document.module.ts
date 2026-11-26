import {Module} from '@nestjs/common';
import {ClinicLicenseModule} from '@application/clinic-license/clinic-license.module';
import {ImportedDocumentController} from '@application/imported-document/controllers/imported-document.controller';
import {
    ApproveDraftService,
    GetOrCreateDraftService,
    UpdateDraftService,
} from '@application/imported-document/services';
import {SubscriptionModule} from '@application/subscription/subscription.module';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, SubscriptionModule, ClinicLicenseModule],
    controllers: [ImportedDocumentController],
    providers: [GetOrCreateDraftService, UpdateDraftService, ApproveDraftService],
})
export class ImportedDocumentModule {}
