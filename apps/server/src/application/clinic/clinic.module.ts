import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ClinicController} from './controllers/clinic.controller';
import {CreateClinicService, GetClinicService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicController],
    providers: [CreateClinicService, GetClinicService],
})
export class ClinicModule {}
