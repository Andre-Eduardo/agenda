import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import type * as request from 'supertest';
import type {Context} from '../support/context';
import {singleEntry} from '../support/data-table-converters';
import {parseValue, resolveReferences} from '../support/parser';

type RequestMethod = 'POST' | 'GET' | 'PUT' | 'DELETE';

type RequestContext = {
    url?: string;
    response?: request.Response;
};

const requestContext: RequestContext = {};

Given(
    'I send a {string} request to {string} with:',
    async function (this: Context, method: RequestMethod, url: string, data: DataTable) {
        const parsedData = singleEntry(this, data);

        const requestMethod = method.toLowerCase() as Lowercase<RequestMethod>;

        const resolvedUrl = resolveReferences(this, url);

        requestContext.url = resolvedUrl;
        requestContext.response = await this.agent[requestMethod](resolvedUrl).send(parsedData);
        this.variables.lastResponse = requestContext.response.body;
    }
);

Given(
    'I send a {string} request to {string} with the query:',
    async function (this: Context, method: RequestMethod, url: string, data: DataTable) {
        const parsedData = singleEntry(this, data);

        const requestMethod = method.toLowerCase() as Lowercase<RequestMethod>;

        const resolvedUrl = resolveReferences(this, url);

        requestContext.url = resolvedUrl;
        requestContext.response = await this.agent[requestMethod](resolvedUrl).query(parsedData);
        this.variables.lastResponse = requestContext.response.body;
    }
);

Given('I send a {string} request to {string}', async function (this: Context, method: RequestMethod, url: string) {
    const requestMethod = method.toLowerCase() as Lowercase<RequestMethod>;

    const resolvedUrl = resolveReferences(this, url);

    requestContext.url = resolvedUrl;
    requestContext.response = await this.agent[requestMethod](resolvedUrl).send();
    this.variables.lastResponse = requestContext.response.body;
});

Then('the request should succeed with a {int} status code', function (statusCode: number) {
    chai.expect(getResponse().status).to.equal(statusCode, getResponse().text);
});

Then('the response should match:', function (this: Context, expectedData: string) {
    this.testMatchPattern(getResponse().body, expectedData);
});

Then(
    'I should receive an invalid input error on {string} with reason {string}',
    function (field: string, reason: string) {
        chai.expect(getResponse().error, 'No error was returned in the response').to.not.be.false;
        chai.expect(getResponse().body).to.containSubset({
            title: 'Invalid input',
            type: 'https://developer.mozilla.org/docs/Web/HTTP/Status/400',
            detail: 'The payload sent is not valid',
            status: 400,
            instance: requestContext.url,
            violations: [
                {
                    field,
                    reason,
                },
            ],
        });
    }
);

Then(
    'I should receive a resource not found error on {string} with reason {string}',
    function (this: Context, resource: string, message: string) {
        chai.expect(getResponse().error, 'No error was returned in the response').to.not.be.false;
        chai.expect(getResponse().body).to.deep.equal({
            title: 'Resource not found',
            type: 'https://developer.mozilla.org/docs/Web/HTTP/Status/404',
            detail: message,
            status: 404,
            instance: requestContext.url,
            resource: parseValue(this, resource),
        });
    }
);

Then('I should receive an invalid input error with message {string}', function (this: Context, message: string) {
    chai.expect(getResponse().error, 'No error was returned in the response').to.not.be.false;
    chai.expect(getResponse().body).to.containSubset({
        title: 'Invalid input',
        type: 'https://developer.mozilla.org/docs/Web/HTTP/Status/400',
        detail: message,
        status: 400,
        instance: requestContext.url,
    });
});

Then('I should receive a precondition failed error with message {string}', function (message: string) {
    chai.expect(getResponse().error, 'No error was returned in the response').to.not.be.false;
    chai.expect(getResponse().body).to.deep.equal({
        title: 'Preconditions not met for the required operation',
        type: 'https://developer.mozilla.org/docs/Web/HTTP/Status/409',
        detail: message,
        status: 409,
        instance: requestContext.url,
    });
});

Then(
    'I should receive an access denied error with message {string} and reason {word}',
    function (message: string, reason: string) {
        chai.expect(getResponse().error, 'No error was returned in the response').to.not.be.false;
        chai.expect(getResponse().body).to.deep.equal({
            title: 'Access denied',
            type: 'https://developer.mozilla.org/docs/Web/HTTP/Status/403',
            detail: message,
            status: 403,
            instance: requestContext.url,
            reason,
        });
    }
);

Then('I should receive an access denied error with reason {word}', function (reason: string) {
    chai.expect(getResponse().error, 'No error was returned in the response').to.not.be.false;
    chai.expect(getResponse().body).to.containSubset({
        title: 'Access denied',
        type: 'https://developer.mozilla.org/docs/Web/HTTP/Status/403',
        status: 403,
        instance: requestContext.url,
        reason,
    });
});

Then('I should receive an unauthenticated error', function () {
    chai.expect(getResponse().error, 'No error was returned in the response').to.not.be.false;
    chai.expect(getResponse().body).to.deep.equal({
        title: 'Authentication required',
        type: 'https://developer.mozilla.org/docs/Web/HTTP/Status/401',
        detail: 'Authentication is required to access this resource.',
        status: 401,
        instance: requestContext.url,
    });
});

function getResponse(): request.Response {
    if (requestContext.response === undefined) {
        throw new Error('A request must be sent first to get a response.');
    }

    return requestContext.response;
}
