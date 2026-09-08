import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {InsuranceClaimDto, ListInsuranceClaimsDto} from '@application/insurance-claim/dtos';
import {InsuranceClaimRepository} from '@domain/insurance-claim/insurance-claim.repository';

@Injectable()
export class ListInsuranceClaimsService implements ApplicationService<ListInsuranceClaimsDto, InsuranceClaimDto[]> {
    constructor(private readonly claimRepository: InsuranceClaimRepository) {}

    async execute({actor, payload}: Command<ListInsuranceClaimsDto>): Promise<InsuranceClaimDto[]> {
        const claims = await this.claimRepository.search({
            clinicId: actor.clinicId,
            claimStatus: payload.claimStatus,
        });

        return claims.map((c) => new InsuranceClaimDto(c));
    }
}
