import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ClinicalProfileController} from './controllers/clinical-profile.controller';
import {GetClinicalProfileService, UpsertClinicalProfileService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicalProfileController],
    providers: [GetClinicalProfileService, UpsertClinicalProfileService],
})
export class ClinicalProfileModule {}
