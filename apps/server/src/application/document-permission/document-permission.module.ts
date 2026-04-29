import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { CrossTenantValidator } from "@application/@shared/validators/cross-tenant.validator";
import { DocumentPermissionController } from "@application/document-permission/controllers/document-permission.controller";
import {
  DocumentPermissionCleanupService,
  GrantDocumentPermissionService,
} from "@application/document-permission/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [DocumentPermissionController],
  providers: [
    GrantDocumentPermissionService,
    DocumentPermissionCleanupService,
    CrossTenantValidator,
  ],
  exports: [DocumentPermissionCleanupService, CrossTenantValidator],
})
export class DocumentPermissionModule {}
