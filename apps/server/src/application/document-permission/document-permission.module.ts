import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {CrossTenantValidator} from '../@shared/validators/cross-tenant.validator';
import {DocumentPermissionController} from './controllers/document-permission.controller';
import {DocumentPermissionCleanupService, GrantDocumentPermissionService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [DocumentPermissionController],
    providers: [GrantDocumentPermissionService, DocumentPermissionCleanupService, CrossTenantValidator],
    exports: [DocumentPermissionCleanupService, CrossTenantValidator],
})
export class DocumentPermissionModule {}
