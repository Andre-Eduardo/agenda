import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {CompanyController} from './controllers';
import {
    CreateCompanyService,
    DeleteCompanyService,
    GetCompanyService,
    ListCompanyService,
    UpdateCompanyService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [CompanyController],
    providers: [
        CreateCompanyService,
        ListCompanyService,
        GetCompanyService,
        UpdateCompanyService,
        DeleteCompanyService,
    ],
})
export class CompanyModule {}
