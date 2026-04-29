import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { PatientController } from "@application/patient/controllers/patient.controller";
import {
  CreatePatientService,
  DeletePatientService,
  GetPatientService,
  SearchPatientsService,
  UpdatePatientService,
} from "@application/patient/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [PatientController],
  providers: [
    CreatePatientService,
    GetPatientService,
    SearchPatientsService,
    UpdatePatientService,
    DeletePatientService,
  ],
})
export class PatientModule {}
