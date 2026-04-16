import {Given} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

// ---------------------------------------------------------------------------
// Given — professional creation helper
// ---------------------------------------------------------------------------

/**
 * Creates a professional and associates it to a user that was previously
 * created via the user step definitions.  The caller must be signed in
 * (i.e. the agent must already have a valid session cookie) before calling
 * this step.
 *
 * The new professional ID is stored as `${ref:id:professional:<key>}` so it
 * can be referenced in subsequent steps (e.g. when signing in with a
 * professional context or when creating patients).
 *
 * Example:
 *   Given a professional "dr_house" exists with specialty "MEDICINA"
 */
Given(
    'a professional {string} exists with specialty {string}',
    async function (this: Context, key: string, specialty: string) {
        const userId = this.getVariableId('user', key);

        const response = await this.agent
            .post('/api/v1/professionals')
            .send({
                name: key,
                specialty,
                documentId: `000.000.000-0${Math.floor(Math.random() * 9)}`,
                userId,
            });

        chai.expect(
            response.status,
            `Professional creation failed for "${key}": ${JSON.stringify(response.body)}`
        ).to.equal(201);

        this.setVariableId('professional', key, response.body.id as string);
    }
);
