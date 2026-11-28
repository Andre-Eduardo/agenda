import {Then} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';
import {resolveReferences} from '../support/parser';

/**
 * Asserts that the last response contains the given JSON (subset match, arrays included).
 *
 * Example:
 *   Then the response should contain the JSON:
 *     """JSON
 *     {"movements": [{"paymentMethod": "PIX", "amountBrl": 120}]}
 *     """
 */
Then('the response should contain the JSON:', function (this: Context, pattern: string) {
    const expected: unknown = JSON.parse(resolveReferences(this, pattern.trim()));

    chai.expect(this.variables.lastResponse).to.containSubset(expected);
});

/**
 * Saves the id of the default account of a type from the last `GET /financial-accounts` response.
 *
 * Example:
 *   Then I save the default "CASH_DRAWER" account as "cash"
 */
Then('I save the default {string} account as {string}', function (this: Context, type: string, key: string) {
    const accounts: unknown = this.variables.lastResponse;

    chai.expect(accounts).to.be.an('array');

    const account = (accounts as Array<{id: string; type: string; isDefault: boolean}>).find(
        (candidate) => candidate.type === type && candidate.isDefault
    );

    chai.expect(account, `Default ${type} account should exist`).to.not.equal(undefined);
    this.setVariableId('financialAccount', key, String(account?.id));
});
