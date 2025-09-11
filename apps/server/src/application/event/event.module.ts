import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {RecordEvent} from './listerners';

@Module({
    imports: [InfrastructureModule],
    providers: [RecordEvent],
})
export class EventModule {}
