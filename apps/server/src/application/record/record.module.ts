import {Module} from '@nestjs/common';
import {ClinicPatientAccessModule} from '@application/clinic-patient-access/clinic-patient-access.module';
import {RecordController} from '@application/record/controllers/record.controller';
import {
    CreateRecordService,
    DeleteRecordService,
    GetRecordAmendmentsService,
    GetRecordService,
    ReopenRecordService,
    SearchRecordsService,
    SignRecordService,
    UpdateRecordService,
} from '@application/record/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule, ClinicPatientAccessModule],
    controllers: [RecordController],
    providers: [
        CreateRecordService,
        GetRecordService,
        GetRecordAmendmentsService,
        SearchRecordsService,
        UpdateRecordService,
        DeleteRecordService,
        SignRecordService,
        ReopenRecordService,
    ],
})
export class RecordModule {}
