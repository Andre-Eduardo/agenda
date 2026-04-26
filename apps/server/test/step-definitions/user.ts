import {Given, Then} from '@cucumber/cucumber';
import type {DataTable} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';
import {resolveReferences} from '../support/parser';

// ---------------------------------------------------------------------------
// Per-scenario password store — kept in memory only (never persisted)
// ---------------------------------------------------------------------------
const passwords: Record<string, string> = {};

function storePassword(username: string, password: string): void {
    passwords[username] = password;
}

function getPassword(username: string): string {
    const pwd = passwords[username];

    if (!pwd) {
        throw new Error(`No password stored for user "${username}". Did you create the user first?`);
    }

    return pwd;
}

// ---------------------------------------------------------------------------
// Given — user creation
// ---------------------------------------------------------------------------

/**
 * Creates one or more users via the sign-up API.
 * Usernames and emails are made unique using the scenario's contextId.
 *
 * Table columns: Name | Username | Email | Password
 * Password is optional — defaults to "<Username>Pa$$w0rd"
 *
 * Example:
 *   Given the following users exist:
 *     | Name     | Username | Email            | Password   |
 *     | John Doe | john_doe | john@example.com | J0hn.Do3!  |
 *     | Jane Doe | jane_doe | jane@example.com |            |
 */
Given(
    'the following users exist:',
    async function (this: Context, table: DataTable) {
        const rows = multipleEntries<{
            Name: string;
            Username: string;
            Email?: string;
            Password?: string;
        }>(this, table);

        for (const row of rows) {
            const username = row.Username;
            const password = row.Password?.trim() || `${username}Pa$$w0rd`;
            const rawEmail = row.Email?.trim() || `${username}@test.agenda.dev`;
            // Always insert contextId before @ to prevent collisions across parallel runs/reruns
            const [localPart, domain] = rawEmail.split('@');
            const email = `${localPart}_${this.variables.contextId}@${domain}`;
            const uniqueUsername = this.getUniqueValue(username);

            storePassword(username, password);

            const response = await this.agent
                .post('/api/v1/user/sign-up')
                .send({
                    name: row.Name,
                    username: uniqueUsername,
                    email,
                    password,
                });

            chai.expect(response.status, `Sign-up failed for "${username}": ${JSON.stringify(response.body)}`).to.equal(201);

            this.setVariableId('user', username, response.body.id as string);
        }
    }
);

/**
 * Creates a single user and signs in immediately, retaining the session cookie.
 *
 * Example:
 *   Given a user "john_doe" exists with password "J0hn.Do3!"
 */
Given(
    'a user {string} exists with password {string}',
    async function (this: Context, username: string, password: string) {
        const uniqueUsername = this.getUniqueValue(username);
        const email = `${uniqueUsername}@test.agenda.dev`;

        storePassword(username, password);

        const response = await this.agent
            .post('/api/v1/user/sign-up')
            .send({
                name: username,
                username: uniqueUsername,
                email,
                password,
            });

        chai.expect(response.status, `Sign-up failed for "${username}": ${JSON.stringify(response.body)}`).to.equal(201);

        this.setVariableId('user', username, response.body.id as string);
    }
);

// ---------------------------------------------------------------------------
// Given — authentication
// ---------------------------------------------------------------------------

/**
 * Signs in as a previously created user.
 * The session cookie is retained by the persistent supertest agent.
 *
 * Example:
 *   Given I am signed in as "john_doe"
 */
Given('I am signed in as {string}', async function (this: Context, username: string) {
    // Clear any existing session before signing in
    this.clearAgent();

    const response = await this.agent
        .post('/api/v1/auth/sign-in')
        .send({
            username: this.getUniqueValue(username),
            password: getPassword(username),
        });

    chai.expect(response.error, `Sign-in failed for "${username}": ${JSON.stringify(response.body)}`).to.be.false;
});

/**
 * Signs in as a previously created user using a specific clinic-member context.
 *
 * Example:
 *   Given I am signed in as "john_doe" with clinic member "${ref:id:clinicMember:dr_house}"
 */
Given(
    'I am signed in as {string} with clinic member {string}',
    async function (this: Context, username: string, clinicMemberId: string) {
        this.clearAgent();

        const response = await this.agent
            .post('/api/v1/auth/sign-in')
            .send({
                username: this.getUniqueValue(username),
                password: getPassword(username),
                clinicMemberId: resolveReferences(this, clinicMemberId),
            });

        chai.expect(response.error, `Sign-in failed for "${username}": ${JSON.stringify(response.body)}`).to.be.false;
    }
);

/**
 * Signs in as a previously created user using a professional's associated clinic-member context.
 * Both professional and clinicMember are stored under the same key by the "a professional X exists"
 * step, so we reverse-lookup the clinicMemberId from the professional ID.
 *
 * Example:
 *   Given I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
 */
Given(
    'I am signed in as {string} with professional {string}',
    async function (this: Context, username: string, professionalRef: string) {
        this.clearAgent();

        const professionalId = resolveReferences(this, professionalRef);

        // Both professional and clinicMember are keyed by the same alias (e.g. "dr_house")
        // so we reverse-lookup the key from the professional ID to find the clinicMemberId.
        const profIds = (this.variables.ids as Record<string, Record<string, string>>)['professional'] ?? {};
        const matchKey = Object.entries(profIds).find(([, id]) => id === professionalId)?.[0];

        if (!matchKey) {
            throw new Error(
                `No clinicMember found matching professional "${professionalRef}". ` +
                `Use "a professional X exists with specialty Y" before this step.`,
            );
        }

        const clinicMemberId = this.getVariableId('clinicMember', matchKey);

        const response = await this.agent
            .post('/api/v1/auth/sign-in')
            .send({
                username: this.getUniqueValue(username),
                password: getPassword(username),
                clinicMemberId,
            });

        chai.expect(response.error, `Sign-in failed for "${username}": ${JSON.stringify(response.body)}`).to.be.false;
    }
);

/**
 * Signs out the current user.
 *
 * Example:
 *   Given I sign out
 */
Given('I sign out', async function (this: Context) {
    await this.agent.post('/api/v1/auth/sign-out');
    this.clearAgent();
});

// ---------------------------------------------------------------------------
// Then — authentication assertions
// ---------------------------------------------------------------------------

/**
 * Asserts the currently authenticated user matches the expected username.
 *
 * Example:
 *   Then I should be signed in as "john_doe"
 */
Then('I should be signed in as {string}', async function (this: Context, username: string) {
    const response = await this.agent.get('/api/v1/user/me');

    chai.expect(response.status).to.equal(200);
    chai.expect(response.body.username).to.equal(this.getUniqueValue(username));
});

/**
 * Asserts there is no active session (GET /user/me returns 401).
 *
 * Example:
 *   Then I should be signed out
 */
Then('I should be signed out', async function (this: Context) {
    const response = await this.agent.get('/api/v1/user/me');

    chai.expect(response.status).to.equal(401);
});
