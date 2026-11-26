import {Given, Then} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

Then('I save the claim for payment {string} as {string}', async function (this: Context, payment: string, key: string) {
    const appointmentPaymentId = this.getVariableId('appointmentPayment', payment);
    const claim = await this.prisma.insuranceClaim.findUniqueOrThrow({where: {appointmentPaymentId}});

    this.setVariableId('insuranceClaim', key, claim.id);
});

/**
 * Composite setup: creates an insurance plan in the clinic and enrolls the
 * patient in it, saving the plan id as `insurancePlan` for `planKey`.
 *
 * Example:
 *   Given the patient "revenue_patient" is enrolled in a new insurance plan "test" named "Test insurance" of clinic "dr_house"
 */
Given(
    'the patient {string} is enrolled in a new insurance plan {string} named {string} of clinic {string}',
    async function (this: Context, patientKey: string, planKey: string, name: string, clinicKey: string) {
        const clinicId = this.getVariableId('clinic', clinicKey);
        const patientId = this.getVariableId('patient', patientKey);

        const plan = await this.agent.post(`/api/v1/clinics/${clinicId}/insurance-plans`).send({name});

        chai.expect(plan.status, `Insurance plan creation failed: ${JSON.stringify(plan.body)}`).to.equal(201);
        chai.expect(plan.body.id).to.be.a('string');
        this.setVariableId('insurancePlan', planKey, String(plan.body.id));

        const enrollment = await this.agent
            .post(`/api/v1/patients/${patientId}/insurance-enrollments`)
            .send({insurancePlanId: plan.body.id});

        chai.expect(enrollment.status, `Insurance enrollment failed: ${JSON.stringify(enrollment.body)}`).to.equal(201);
    }
);

/**
 * Composite flow: moves an appointment through check-in, call and completion,
 * asserting each transition succeeds.
 *
 * Example:
 *   Given the appointment "evaluation" is checked in, called and completed
 */
Given('the appointment {string} is checked in, called and completed', async function (this: Context, key: string) {
    const appointmentId = this.getVariableId('appointment', key);

    for (const transition of ['checkin', 'call', 'complete']) {
        const response = await this.agent.patch(`/api/v1/appointments/${appointmentId}/${transition}`);

        chai.expect(response.status, `${transition} failed: ${JSON.stringify(response.body)}`).to.equal(200);
    }
});
