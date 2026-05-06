import {Module} from '@nestjs/common';
import {RecordEvent} from '@application/event/listerners';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    providers: [RecordEvent],
})
export class EventModule {}
