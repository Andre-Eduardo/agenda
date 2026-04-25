import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ClinicController} from './controllers/clinic.controller';
import {
    CreateClinicService,
    CreateInsurancePlanService,
    GetClinicService,
    ListInsurancePlansService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicController],
    providers: [CreateClinicService, GetClinicService, CreateInsurancePlanService, ListInsurancePlansService],
})
export class ClinicModule {}
