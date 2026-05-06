import {Module} from '@nestjs/common';
import {ClinicalProfileController} from '@application/clinical-profile/controllers/clinical-profile.controller';
import {GetClinicalProfileService, UpsertClinicalProfileService} from '@application/clinical-profile/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicalProfileController],
    providers: [GetClinicalProfileService, UpsertClinicalProfileService],
})
export class ClinicalProfileModule {}
