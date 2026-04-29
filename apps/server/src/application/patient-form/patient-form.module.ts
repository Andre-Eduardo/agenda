import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { PatientFormController } from "@application/patient-form/controllers/patient-form.controller";
import { FormFieldIndexController } from "@application/patient-form/controllers/form-field-index.controller";
import { FormAiContextController } from "@application/patient-form/controllers/form-ai-context.controller";
import {
  StartPatientFormService,
  SavePatientFormDraftService,
  CompletePatientFormService,
  GetPatientFormService,
  SearchPatientFormsService,
  FormResponseValidatorService,
  FormScoringService,
  FormFieldIndexerService,
  FormAiContextService,
  BuildRecordFromPatientFormService,
} from "@application/patient-form/services";

@Module({
  imports: [InfrastructureModule],
  controllers: [PatientFormController, FormFieldIndexController, FormAiContextController],
  providers: [
    StartPatientFormService,
    SavePatientFormDraftService,
    CompletePatientFormService,
    GetPatientFormService,
    SearchPatientFormsService,
    FormResponseValidatorService,
    FormScoringService,
    FormFieldIndexerService,
    FormAiContextService,
    BuildRecordFromPatientFormService,
  ],
})
export class PatientFormModule {}
