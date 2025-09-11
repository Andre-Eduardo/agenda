import {Body, Controller, Delete, Get, Post, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {RoomCategoryPermission} from '../../../domain/auth';
import {RoomCategoryId} from '../../../domain/room-category/entities';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation, ApiPaginatedOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    RoomCategoryDto,
    deleteRoomCategorySchema,
    UpdateRoomCategoryInputDto,
    updateRoomCategorySchema,
    getRoomCategorySchema,
    ListRoomCategoryDto,
    CreateRoomCategoryDto,
} from '../dtos';
import {
    CreateRoomCategoryService,
    DeleteRoomCategoryService,
    GetRoomCategoryService,
    ListRoomCategoryService,
    UpdateRoomCategoryService,
} from '../services';

@ApiTags('Room category')
@Controller('room-category')
export class RoomCategoryController {
    constructor(
        private readonly createRoomCategoryService: CreateRoomCategoryService,
        private readonly deleteRoomCategoryService: DeleteRoomCategoryService,
        private readonly getRoomCategoryService: GetRoomCategoryService,
        private readonly listRoomCategoryService: ListRoomCategoryService,
        private readonly updateRoomCategoryService: UpdateRoomCategoryService
    ) {}

    @ApiOperation({
        summary: 'Creates a new room category',
        responses: [
            {
                status: 201,
                description: 'Room category created',
                type: RoomCategoryDto,
            },
        ],
    })
    @Authorize(RoomCategoryPermission.CREATE)
    @Post()
    async createCategory(
        @RequestActor() actor: Actor,
        @Body() payload: CreateRoomCategoryDto
    ): Promise<RoomCategoryDto> {
        return this.createRoomCategoryService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets a room category',
        parameters: [entityIdParam('Room category ID')],
        responses: [
            {
                status: 200,
                description: 'Room category found',
                type: RoomCategoryDto,
            },
        ],
    })
    @Authorize(RoomCategoryPermission.VIEW)
    @Get(':id')
    async getCategory(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getRoomCategorySchema.shape.id) id: RoomCategoryId
    ): Promise<RoomCategoryDto> {
        return this.getRoomCategoryService.execute({actor, payload: {id}});
    }

    @ApiPaginatedOperation({
        summary: 'Finds a room category',
        responses: [
            {
                status: 200,
                description: 'Room category found',
                model: RoomCategoryDto,
            },
        ],
    })
    @Authorize(RoomCategoryPermission.VIEW)
    @Get()
    async listCategory(
        @RequestActor() actor: Actor,
        @Query() payload: ListRoomCategoryDto
    ): Promise<PaginatedDto<RoomCategoryDto>> {
        return this.listRoomCategoryService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Updates a room category',
        parameters: [entityIdParam('Room category ID')],
        responses: [
            {
                status: 200,
                description: 'Room category updated',
                type: RoomCategoryDto,
            },
        ],
    })
    @Authorize(RoomCategoryPermission.UPDATE)
    @Put(':id')
    async updateCategory(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateRoomCategorySchema.shape.id) id: RoomCategoryId,
        @Body() payload: UpdateRoomCategoryInputDto
    ): Promise<RoomCategoryDto> {
        return this.updateRoomCategoryService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Deletes a room category',
        parameters: [entityIdParam('Room category ID')],
        responses: [
            {
                status: 200,
                description: 'Room category deleted',
            },
        ],
    })
    @Authorize(RoomCategoryPermission.DELETE)
    @Delete(':id')
    async deleteCategory(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteRoomCategorySchema.shape.id) id: RoomCategoryId
    ): Promise<void> {
        await this.deleteRoomCategoryService.execute({actor, payload: {id}});
    }
}
