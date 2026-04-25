import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {RecordController} from './controllers/record.controller';
import {
    CreateRecordService,
    DeleteRecordService,
    GetRecordAmendmentsService,
    GetRecordService,
    ReopenRecordService,
    SearchRecordsService,
    SignRecordService,
    UpdateRecordService,
} from './services';

@Module({
    imports: [InfrastructureModule],
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
