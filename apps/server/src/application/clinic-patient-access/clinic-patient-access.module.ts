import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { ClinicPatientAccessController } from "@application/clinic-patient-access/controllers/clinic-patient-access.controller";
import {
  GrantClinicPatientAccessService,
  RevokeClinicPatientAccessService,
} from "@application/clinic-patient-access/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [ClinicPatientAccessController],
  providers: [GrantClinicPatientAccessService, RevokeClinicPatientAccessService],
})
export class ClinicPatientAccessModule {}
