import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {SupplierController} from './controllers';
import {
    CreateSupplierService,
    DeleteSupplierService,
    GetSupplierService,
    ListSupplierService,
    UpdateSupplierService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [SupplierController],
    providers: [
        CreateSupplierService,
        ListSupplierService,
        GetSupplierService,
        UpdateSupplierService,
        DeleteSupplierService,
    ],
})
export class SupplierModule {}
