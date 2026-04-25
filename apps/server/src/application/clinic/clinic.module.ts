import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ClinicController} from './controllers/clinic.controller';
import {
    CreateClinicService,
    CreateInsurancePlanService,
    GetClinicService,
    ListInsurancePlansService,
    UpdateClinicService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicController],
    providers: [CreateClinicService, GetClinicService, CreateInsurancePlanService, ListInsurancePlansService, UpdateClinicService],
})
export class ClinicModule {}
