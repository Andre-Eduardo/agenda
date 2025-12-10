import {Controller} from '@nestjs/common';
import {RecordService} from '../services/record.service';

@Controller('records')
export class RecordController {
    constructor(private readonly service: RecordService) {}
}
