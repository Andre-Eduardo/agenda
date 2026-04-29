import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { SubscriptionModule } from "@application/subscription/subscription.module";
import { ImportedDocumentController } from "@application/imported-document/controllers/imported-document.controller";
import {
  ApproveDraftService,
  GetOrCreateDraftService,
  UpdateDraftService,
} from "@application/imported-document/services";

@Module({
  imports: [InfrastructureModule, SubscriptionModule],
  controllers: [ImportedDocumentController],
  providers: [GetOrCreateDraftService, UpdateDraftService, ApproveDraftService],
})
export class ImportedDocumentModule {}
