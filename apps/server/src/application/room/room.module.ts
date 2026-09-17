import {Module} from '@nestjs/common';
import {RoomController} from '@application/room/controllers/room.controller';
import {CreateRoomService, DeleteRoomService, ListRoomsService, UpdateRoomService} from '@application/room/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [RoomController],
    providers: [CreateRoomService, ListRoomsService, UpdateRoomService, DeleteRoomService],
})
export class RoomModule {}
