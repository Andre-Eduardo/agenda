import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {DocumentPermissionController} from './controllers/document-permission.controller';
import {GrantDocumentPermissionService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [DocumentPermissionController],
    providers: [GrantDocumentPermissionService],
})
export class DocumentPermissionModule {}
