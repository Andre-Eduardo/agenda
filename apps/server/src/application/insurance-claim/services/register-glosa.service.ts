import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {InsuranceClaimDto, RegisterGlosaDto} from '@application/insurance-claim/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {InsuranceClaimRepository} from '@domain/insurance-claim/insurance-claim.repository';

@Injectable()
export class RegisterGlosaService implements ApplicationService<RegisterGlosaDto, InsuranceClaimDto> {
    constructor(
        private readonly claimRepository: InsuranceClaimRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({
        actor,
        payload: {id, reason, glosaAmountBrl, approvedAmountBrl},
    }: Command<RegisterGlosaDto>): Promise<InsuranceClaimDto> {
        const claim = await this.claimRepository.findById(id);

        if (claim === null) {
            throw new ResourceNotFoundException('insurance_claim.not_found', id.toString());
        }

        if (!claim.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Claim does not belong to the current clinic.');
        }

        claim.registerGlosa(reason, glosaAmountBrl, approvedAmountBrl);

        await this.claimRepository.save(claim);

        this.eventDispatcher.dispatch(actor, claim);

        return new InsuranceClaimDto(claim);
    }
}
