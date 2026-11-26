import {Then} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

Then(
    'only one concurrent reopening of record {string} should succeed',
    async function (this: Context, recordKey: string) {
        const id = this.getVariableId('record', recordKey);
        const body = {justification: 'Correct concurrent note'};
        const results = await Promise.all([
            this.agent.post(`/api/v1/records/${id}/reopen`).send(body),
            this.agent.post(`/api/v1/records/${id}/reopen`).send(body),
        ]);

        chai.expect(results.map((response) => response.status).toSorted((a, b) => a - b)).to.deep.equal([200, 409]);
    }
);
