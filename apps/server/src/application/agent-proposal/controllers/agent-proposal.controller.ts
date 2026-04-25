import {Body, Controller, Get, Param, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {createZodDto} from '../../@shared/validation/dto';
import {RecordPermission} from '../../../domain/auth';
import {ApiOperation} from '../../@shared/openapi/decorators';
import type {Actor} from '../../../domain/@shared/actor';
import {ConfirmProposalService} from '../services/confirm-proposal.service';
import {RejectProposalService} from '../services/reject-proposal.service';
import {ListPendingProposalsService} from '../services/list-pending-proposals.service';

const rejectSchema = z.object({
    reason: z.string().max(500).optional(),
});

class RejectProposalDto extends createZodDto(rejectSchema) {}

@ApiTags('Agent Proposals')
@Controller('agent-proposals')
export class AgentProposalController {
    constructor(
        private readonly confirmProposal: ConfirmProposalService,
        private readonly rejectProposal: RejectProposalService,
        private readonly listPendingProposals: ListPendingProposalsService,
    ) {}

    @ApiOperation({
        summary: 'List pending proposals for the actor\'s current clinic',
        responses: [{status: 200, description: 'List of pending proposals'}],
    })
    @Authorize(RecordPermission.VIEW)
    @Get()
    async listPending(@RequestActor() actor: Actor) {
        return this.listPendingProposals.execute({
            actor,
            payload: {clinicId: actor.clinicId.toString()},
        });
    }

    @ApiOperation({
        summary: 'Confirm a proposal and execute the action',
        responses: [
            {status: 200, description: 'Proposal confirmed and action executed'},
            {status: 403, description: 'Not authorized'},
            {status: 404, description: 'Proposal not found'},
            {status: 409, description: 'Proposal is not confirmable'},
        ],
    })
    @Authorize(RecordPermission.CREATE)
    @Post(':id/confirm')
    async confirm(@RequestActor() actor: Actor, @Param('id') id: string) {
        return this.confirmProposal.execute({actor, payload: {proposalId: id}});
    }

    @ApiOperation({
        summary: 'Reject a proposal',
        responses: [
            {status: 200, description: 'Proposal rejected'},
            {status: 403, description: 'Not authorized'},
            {status: 404, description: 'Proposal not found'},
        ],
    })
    @Authorize(RecordPermission.VIEW)
    @Post(':id/reject')
    async reject(@RequestActor() actor: Actor, @Param('id') id: string, @Body() dto: RejectProposalDto) {
        await this.rejectProposal.execute({actor, payload: {proposalId: id, reason: dto.reason}});
    }
}
