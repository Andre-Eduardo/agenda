import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {PatientFormController} from './controllers/patient-form.controller';
import {FormFieldIndexController} from './controllers/form-field-index.controller';
import {FormAiContextController} from './controllers/form-ai-context.controller';
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
} from './services';

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
