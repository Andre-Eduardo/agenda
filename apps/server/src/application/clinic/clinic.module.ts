import {Module} from '@nestjs/common';
import {ClinicController} from '@application/clinic/controllers/clinic.controller';
import {
    ChangeClinicAccountTypeService,
    CreateClinicService,
    CreateInsurancePlanService,
    GetClinicService,
    ListInsurancePlansService,
    SearchClinicsService,
    UpdateClinicService,
} from '@application/clinic/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicController],
    providers: [
        CreateClinicService,
        GetClinicService,
        CreateInsurancePlanService,
        ListInsurancePlansService,
        SearchClinicsService,
        UpdateClinicService,
        ChangeClinicAccountTypeService,
    ],
    exports: [SearchClinicsService],
})
export class ClinicModule {}
