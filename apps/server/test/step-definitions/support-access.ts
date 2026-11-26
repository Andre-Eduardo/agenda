import {Given, Then} from '@cucumber/cucumber';
import type {GlobalRole} from '@prisma/client';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

/**
 * Global roles have no public API to be granted from (a SUPER_ADMIN is seeded), so scenarios
 * set them directly.
 *
 * Example:
 *   Given the user "ana" has the global role "SUPPORT"
 */
Given(
    'the user {string} has the global role {string}',
    async function (this: Context, username: string, globalRole: string) {
        await this.prisma.user.update({
            where: {id: this.getVariableId('user', username)},
            data: {globalRole: globalRole as GlobalRole},
        });
    }
);

Then(
    'the audit trail of clinic {string} should show {string} by {string}',
    async function (this: Context, clinicKey: string, action: string, username: string) {
        const entry = await this.prisma.auditLog.findFirst({
            where: {
                clinicId: this.getVariableId('clinic', clinicKey),
                actorUserId: this.getVariableId('user', username),
                action,
            },
            orderBy: {occurredAt: 'desc'},
        });

        chai.expect(entry, `No "${action}" audit entry for "${username}"`).to.not.equal(null);
    }
);

Then(
    'the audit trail of clinic {string} should show a denied {string} by {string}',
    async function (this: Context, clinicKey: string, action: string, username: string) {
        const entry = await this.prisma.auditLog.findFirst({
            where: {
                clinicId: this.getVariableId('clinic', clinicKey),
                actorUserId: this.getVariableId('user', username),
                action,
                result: 'DENIED',
            },
            orderBy: {occurredAt: 'desc'},
        });

        chai.expect(entry, `No denied "${action}" audit entry for "${username}"`).to.not.equal(null);
        chai.expect(entry?.statusCode).to.equal(403);
    }
);

Then('the response list should not contain the user {string}', function (this: Context, username: string) {
    const list = this.variables.lastResponse;

    chai.expect(list).to.be.an('array');
    chai.expect((list as Array<{userId: string}>).map((item) => item.userId)).to.not.include(
        this.getVariableId('user', username)
    );
});
