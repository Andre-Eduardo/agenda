import {Module} from '@nestjs/common';
import {RoomModule} from './room/room.module';

const sharedModules = [RoomModule];

@Module({
    imports: sharedModules,
    exports: sharedModules,
})
export class DomainModule {}
