import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {RoomStateService} from './services';

@Module({
    imports: [InfrastructureModule],
    providers: [RoomStateService],
    exports: [RoomStateService],
})
export class RoomModule {}
