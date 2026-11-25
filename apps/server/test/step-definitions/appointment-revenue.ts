import {Then} from '@cucumber/cucumber';
import type {Context} from '../support/context';

Then('I save the claim for payment {string} as {string}', async function (this: Context, payment: string, key: string) {
    const appointmentPaymentId = this.getVariableId('appointmentPayment', payment);
    const claim = await this.prisma.insuranceClaim.findUniqueOrThrow({where: {appointmentPaymentId}});

    this.setVariableId('insuranceClaim', key, claim.id);
});
