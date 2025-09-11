import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {RoomController} from './controllers';
import {CreateRoomService, DeleteRoomService, GetRoomService, ListRoomService, UpdateRoomService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [RoomController],
    providers: [CreateRoomService, ListRoomService, GetRoomService, UpdateRoomService, DeleteRoomService],
})
export class RoomModule {}
