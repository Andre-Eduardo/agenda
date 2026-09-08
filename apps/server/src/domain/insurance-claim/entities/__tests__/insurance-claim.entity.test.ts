import {PreconditionException} from '@domain/@shared/exceptions';
import {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import {ClinicId} from '@domain/clinic/entities';
import {InsuranceAuthorizationStatus, InsuranceClaim, InsuranceClaimStatus} from '@domain/insurance-claim/entities';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {PatientInsuranceEnrollmentId} from '@domain/patient-insurance-enrollment/entities';

describe('InsuranceClaim', () => {
    function createClaim(authorizationCode: string | null = null): InsuranceClaim {
        return InsuranceClaim.create({
            clinicId: ClinicId.generate(),
            appointmentPaymentId: AppointmentPaymentId.generate(),
            patientInsuranceEnrollmentId: PatientInsuranceEnrollmentId.generate(),
            insurancePlanId: InsurancePlanId.generate(),
            authorizationCode,
            submittedAmountBrl: 200,
        });
    }

    it('should start as DRAFT with NOT_REQUIRED authorization when no code is given', () => {
        const claim = createClaim();

        expect(claim.claimStatus).toBe(InsuranceClaimStatus.DRAFT);
        expect(claim.authorizationStatus).toBe(InsuranceAuthorizationStatus.NOT_REQUIRED);
    });

    it('should start AUTHORIZED when an authorization code is given at creation', () => {
        const claim = createClaim('AUTH-1');

        expect(claim.authorizationStatus).toBe(InsuranceAuthorizationStatus.AUTHORIZED);
    });

    it('should move from DRAFT to SUBMITTED on submit()', () => {
        const claim = createClaim();

        claim.submit();

        expect(claim.claimStatus).toBe(InsuranceClaimStatus.SUBMITTED);
        expect(claim.submittedAt).not.toBeNull();
    });

    it('should not allow submitting twice', () => {
        const claim = createClaim();

        claim.submit();

        expect(() => claim.submit()).toThrowWithMessage(PreconditionException, 'insurance_claim.cannot_submit');
    });

    it('should mark as PAID from SUBMITTED', () => {
        const claim = createClaim();

        claim.submit();
        claim.markPaid(200);

        expect(claim.claimStatus).toBe(InsuranceClaimStatus.PAID);
        expect(claim.approvedAmountBrl).toBe(200);
        expect(claim.resolvedAt).not.toBeNull();
    });

    it('should not allow marking a DRAFT claim as paid', () => {
        const claim = createClaim();

        expect(() => claim.markPaid(200)).toThrowWithMessage(PreconditionException, 'insurance_claim.cannot_mark_paid');
    });

    it('should register a full glosa as DENIED when approved amount is zero', () => {
        const claim = createClaim();

        claim.submit();
        claim.registerGlosa('Fora da cobertura', 200, 0);

        expect(claim.claimStatus).toBe(InsuranceClaimStatus.DENIED);
        expect(claim.glosaAmountBrl).toBe(200);
    });

    it('should register a partial glosa as PARTIALLY_PAID when some amount is approved', () => {
        const claim = createClaim();

        claim.submit();
        claim.registerGlosa('Divergência de tabela', 50, 150);

        expect(claim.claimStatus).toBe(InsuranceClaimStatus.PARTIALLY_PAID);
        expect(claim.approvedAmountBrl).toBe(150);
    });
});
