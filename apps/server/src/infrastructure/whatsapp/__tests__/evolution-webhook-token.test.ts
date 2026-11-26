import {ClinicId} from '@domain/clinic/entities';
import {signEvolutionWebhookToken, verifyEvolutionWebhookToken} from '../evolution-webhook-token';

describe('The Evolution webhook token', () => {
    const clinicId = ClinicId.generate();

    it('should accept the token signed for the clinic', () => {
        const token = signEvolutionWebhookToken('secret', clinicId);

        expect(verifyEvolutionWebhookToken('secret', clinicId, token)).toBe(true);
    });

    it('should reject a token of another clinic, another secret or no token', () => {
        const token = signEvolutionWebhookToken('secret', clinicId);

        expect(verifyEvolutionWebhookToken('secret', ClinicId.generate(), token)).toBe(false);
        expect(verifyEvolutionWebhookToken('other', clinicId, token)).toBe(false);
        expect(verifyEvolutionWebhookToken('secret', clinicId, undefined)).toBe(false);
        expect(verifyEvolutionWebhookToken('secret', clinicId, 'short')).toBe(false);
    });
});
