import {Module} from '@nestjs/common';
import {InsuranceClaimController} from '@application/insurance-claim/controllers/insurance-claim.controller';
import {
    AuthorizeInsuranceClaimService,
    ListInsuranceClaimsService,
    MarkInsuranceClaimPaidService,
    RegisterGlosaService,
    SubmitInsuranceClaimService,
} from '@application/insurance-claim/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [InsuranceClaimController],
    providers: [
        ListInsuranceClaimsService,
        AuthorizeInsuranceClaimService,
        SubmitInsuranceClaimService,
        RegisterGlosaService,
        MarkInsuranceClaimPaidService,
    ],
})
export class InsuranceClaimModule {}
