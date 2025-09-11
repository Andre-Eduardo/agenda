import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {RoomCategoryController} from './controllers';
import {
    CreateRoomCategoryService,
    DeleteRoomCategoryService,
    GetRoomCategoryService,
    ListRoomCategoryService,
    UpdateRoomCategoryService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [RoomCategoryController],
    providers: [
        CreateRoomCategoryService,
        ListRoomCategoryService,
        GetRoomCategoryService,
        UpdateRoomCategoryService,
        DeleteRoomCategoryService,
    ],
})
export class RoomCategoryModule {}
