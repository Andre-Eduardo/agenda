import {Module} from '@nestjs/common';
import {ProcedureController} from '@application/procedure/controllers';
import {ProcedureCatalogService} from '@application/procedure/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ProcedureController],
    providers: [ProcedureCatalogService],
})
export class ProcedureModule {}
