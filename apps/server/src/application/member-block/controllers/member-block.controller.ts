import {Body, Controller, Delete, Get, HttpCode, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {MemberBlockId} from '../../../domain/professional/entities';
import {MemberBlockPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '../../@shared/validation';
import {entityId} from '../../@shared/validation/schemas';
import {CreateMemberBlockDto, ListMemberBlocksDto, MemberBlockDto, listMemberBlocksSchema} from '../dtos';
import {CreateMemberBlockService, DeleteMemberBlockService, ListMemberBlocksService} from '../services';

const memberIdSchema = entityId(ClinicMemberId);
const blockIdSchema = entityId(MemberBlockId);

@ApiTags('MemberBlock')
@Controller('members/:memberId/blocks')
export class MemberBlockController {
    constructor(
        private readonly createService: CreateMemberBlockService,
        private readonly listService: ListMemberBlocksService,
        private readonly deleteService: DeleteMemberBlockService,
    ) {}

    @ApiOperation({
        summary: 'Creates a schedule block for a member',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [{status: 201, description: 'Block created', type: MemberBlockDto}],
    })
    @Authorize(MemberBlockPermission.CREATE)
    @Post()
    async create(
        @RequestActor() actor: Actor,
        @ValidatedParam('memberId', memberIdSchema) memberId: ClinicMemberId,
        @Body() payload: CreateMemberBlockDto,
    ): Promise<MemberBlockDto> {
        return this.createService.execute({actor, payload: {...payload, memberId}});
    }

    @ApiOperation({
        summary: 'Lists schedule blocks for a member',
        parameters: [entityIdParam('Member ID', 'memberId')],
        responses: [{status: 200, description: 'List of blocks', type: [MemberBlockDto]}],
    })
    @Authorize(MemberBlockPermission.LIST)
    @Get()
    async list(
        @RequestActor() actor: Actor,
        @ValidatedParam('memberId', memberIdSchema) memberId: ClinicMemberId,
        @Query(new ZodValidationPipe(listMemberBlocksSchema)) query: ListMemberBlocksDto,
    ): Promise<MemberBlockDto[]> {
        return this.listService.execute({actor, payload: {...query, memberId}});
    }

    @ApiOperation({
        summary: 'Deletes a schedule block',
        parameters: [entityIdParam('Member ID', 'memberId'), entityIdParam('Block ID', 'blockId')],
        responses: [{status: 204, description: 'Block deleted'}],
    })
    @Authorize(MemberBlockPermission.DELETE)
    @Delete(':blockId')
    @HttpCode(204)
    async delete(
        @RequestActor() actor: Actor,
        @ValidatedParam('memberId', memberIdSchema) memberId: ClinicMemberId,
        @ValidatedParam('blockId', blockIdSchema) blockId: MemberBlockId,
    ): Promise<void> {
        await this.deleteService.execute({actor, payload: {memberId, blockId}});
    }
}
