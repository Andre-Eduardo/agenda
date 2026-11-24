import {Module} from '@nestjs/common';
import {ClinicLicenseController} from '@application/clinic-license/controllers/clinic-license.controller';
import {
    ConfigureClinicLicenseService,
    GetClinicLicenseService,
    GetMyModulesService,
    SetModuleMembersService,
} from '@application/clinic-license/services';
import {ModuleAccess} from '@domain/clinic-license/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicLicenseController],
    providers: [
        ModuleAccess,
        GetClinicLicenseService,
        ConfigureClinicLicenseService,
        SetModuleMembersService,
        GetMyModulesService,
    ],
    exports: [ModuleAccess],
})
export class ClinicLicenseModule {}
