import {Then} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

function responseHasResourceId(response: unknown, resourceId: string): boolean {
    if (response === null || typeof response !== 'object' || !('data' in response) || !Array.isArray(response.data)) {
        throw new Error('Expected a paginated audit response');
    }

    return response.data.some(
        (entry: unknown) =>
            entry !== null && typeof entry === 'object' && 'resourceId' in entry && entry.resourceId === resourceId
    );
}

Then(
    'the audit trail for patient {string} should show a successful read by {string}',
    async function (this: Context, patient: string, username: string) {
        const entry = await this.prisma.auditLog.findFirst({
            where: {
                clinicId: this.getVariableId('clinic', username),
                actorUserId: this.getVariableId('user', username),
                resource: 'PatientController',
                resourceId: this.getVariableId('patient', patient),
                action: 'GET:getPatient',
                result: 'SUCCESS',
            },
            orderBy: {occurredAt: 'desc'},
        });

        chai.expect(entry).to.not.equal(null);
        chai.expect(entry?.actorMemberId).to.equal(this.getVariableId('clinicMember', username));
        chai.expect(entry?.statusCode).to.equal(200);
        chai.expect(entry?.occurredAt).to.be.instanceOf(Date);
    }
);

Then(
    'the audit trail should show access denied for {string} in clinic {string}',
    async function (this: Context, username: string, clinicOwner: string) {
        const entry = await this.prisma.auditLog.findFirst({
            where: {
                clinicId: this.getVariableId('clinic', clinicOwner),
                actorUserId: this.getVariableId('user', username),
                resource: 'AuditLogController',
                action: 'GET:search',
                result: 'DENIED',
            },
            orderBy: {occurredAt: 'desc'},
        });

        chai.expect(entry).to.not.equal(null);
        chai.expect(entry?.statusCode).to.equal(403);
    }
);

Then('the audit response should contain the patient {string}', function (this: Context, patient: string) {
    chai.expect(responseHasResourceId(this.variables.lastResponse, this.getVariableId('patient', patient))).to.equal(
        true
    );
});

Then('the audit response should not contain the patient {string}', function (this: Context, patient: string) {
    chai.expect(responseHasResourceId(this.variables.lastResponse, this.getVariableId('patient', patient))).to.equal(
        false
    );
});
