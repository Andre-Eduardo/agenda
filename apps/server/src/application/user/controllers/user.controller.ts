import {Body, Controller, Delete, Get, Patch, Post, Put} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor, UnauthenticatedActor} from '../../../domain/@shared/actor';
import {UserPermission} from '../../../domain/auth';
import {UserId} from '../../../domain/user/entities';
import {Authorize, Public} from '../../@shared/auth';
import {BypassProfessional} from '../../@shared/auth/bypass-professional.decorator';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {
    UserDto,
    deleteUserSchema,
    getUserSchema,
    UpdateUserInputDto,
    updateUserSchema,
    SignUpUserDto,
    DeleteUserInputDto,
    ChangeUserPasswordDto,
} from '../dtos';
import {
    DeleteUserService,
    GetUserService,
    SignUpUserService,
    ChangeUserPasswordService,
    UpdateUserService,
} from '../services';

@BypassProfessional()
@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(
        private readonly signUpUserService: SignUpUserService,
        private readonly getUserService: GetUserService,
        private readonly updateUserService: UpdateUserService,
        private readonly changeUserPasswordService: ChangeUserPasswordService,
        private readonly deleteUserService: DeleteUserService
    ) {}

    @ApiOperation({
        summary: 'Signs up a new user',
        responses: [
            {
                status: 201,
                description: 'User signed up',
                type: UserDto,
            },
        ],
    })
    @Public()
    @Post('/sign-up')
    async signUp(@RequestActor() actor: UnauthenticatedActor, @Body() payload: SignUpUserDto): Promise<UserDto> {
        return this.signUpUserService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Gets the current user',
        responses: [
            {
                status: 200,
                description: 'User found',
                type: UserDto,
            },
        ],
    })
    @Authorize(UserPermission.VIEW_PROFILE)
    @Get('/me')
    async getCurrentUser(@RequestActor() actor: Actor): Promise<UserDto> {
        return this.getUserService.execute({
            actor,
            payload: {
                id: actor.userId,
            },
        });
    }

    @ApiOperation({
        summary: 'Gets a user',
        parameters: [entityIdParam('User ID')],
        responses: [
            {
                status: 200,
                description: 'User found',
                type: UserDto,
            },
        ],
    })
    @Authorize(UserPermission.VIEW)
    @Get(':id')
    async getUser(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getUserSchema.shape.id) id: UserId
    ): Promise<UserDto> {
        return this.getUserService.execute({actor, payload: {id}});
    }

    @ApiOperation({
        summary: 'Updates a user',
        parameters: [entityIdParam('User ID')],
        responses: [
            {
                status: 200,
                description: 'User updated',
                type: UserDto,
            },
        ],
    })
    @Authorize(UserPermission.UPDATE)
    @Put(':id')
    async updateUser(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateUserSchema.shape.id) id: UserId,
        @Body() payload: UpdateUserInputDto
    ): Promise<UserDto> {
        return this.updateUserService.execute({actor, payload: {id, ...payload}});
    }

    @ApiOperation({
        summary: 'Changes the user password',
        responses: [
            {
                status: 200,
                description: 'User password changed',
            },
        ],
    })
    @Authorize(UserPermission.CHANGE_PASSWORD)
    @Patch('/change-password')
    async changeUserPassword(@RequestActor() actor: Actor, @Body() payload: ChangeUserPasswordDto): Promise<void> {
        await this.changeUserPasswordService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Deletes a user',
        parameters: [entityIdParam('User ID')],
        responses: [
            {
                status: 200,
                description: 'User deleted',
            },
        ],
    })
    @Authorize(UserPermission.DELETE)
    @Delete(':id')
    async deleteUser(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteUserSchema.shape.id) id: UserId,
        @Body() payload: DeleteUserInputDto
    ): Promise<void> {
        await this.deleteUserService.execute({actor, payload: {id, ...payload}});
    }
}
