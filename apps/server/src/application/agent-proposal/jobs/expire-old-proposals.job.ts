import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';

@Injectable()
export class ExpireOldProposalsJob {
    private readonly logger = new Logger(ExpireOldProposalsJob.name);

    constructor(private readonly agentProposalRepository: AgentProposalRepository) {}

    @Cron(CronExpression.EVERY_HOUR)
    async handle(): Promise<void> {
        const count = await this.agentProposalRepository.markExpired(new Date());
        if (count > 0) {
            this.logger.log(`Expired ${count} pending proposals`);
        }
    }
}
