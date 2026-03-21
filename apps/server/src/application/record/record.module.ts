import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {RecordController} from './controllers/record.controller';
import {
    CreateRecordService,
    DeleteRecordService,
    GetRecordService,
    SearchRecordsService,
    UpdateRecordService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [RecordController],
    providers: [
        CreateRecordService,
        GetRecordService,
        SearchRecordsService,
        UpdateRecordService,
        DeleteRecordService,
    ],
})
export class RecordModule {}
