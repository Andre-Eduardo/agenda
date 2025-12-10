import {Module} from '@nestjs/common';
import {RecordController} from './controllers/record.controller';
import {RecordService} from './services/record.service';

@Module({
    controllers: [RecordController],
    providers: [RecordService],
})
export class RecordModule {}
