import {Module} from '@nestjs/common';
import {ClinicController} from '@application/clinic/controllers/clinic.controller';
import {
    CreateClinicService,
    CreateInsurancePlanService,
    GetClinicService,
    ListInsurancePlansService,
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
        UpdateClinicService,
    ],
})
export class ClinicModule {}
