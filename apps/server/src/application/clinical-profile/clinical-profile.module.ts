import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { ClinicalProfileController } from "@application/clinical-profile/controllers/clinical-profile.controller";
import {
  GetClinicalProfileService,
  UpsertClinicalProfileService,
} from "@application/clinical-profile/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [ClinicalProfileController],
  providers: [GetClinicalProfileService, UpsertClinicalProfileService],
})
export class ClinicalProfileModule {}
