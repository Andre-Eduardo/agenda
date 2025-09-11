import {UpdatePaymentMethodInputDto} from '../update-payment-method.dto';

describe('A UpdatePaymentMethodInput', () => {
    it.each([
        {
            name: 'Cash',
        },
    ])('should accept valid payloads', (payload) => {
        expect(UpdatePaymentMethodInputDto.schema.safeParse(payload)).toEqual(
            expect.objectContaining({
                success: true,
            })
        );
    });
});
