import {Injectable} from '@nestjs/common';
import {RecordRepository} from '../../../domain/record/record.repository';

@Injectable()
export class RecordService {
    constructor(private readonly repository: RecordRepository) {}
}
