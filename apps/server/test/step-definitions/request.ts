import {Given, Then, When} from '@cucumber/cucumber';
import type {Response} from 'supertest';
import * as qs from 'qs';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';
import {singleEntry} from '../support/data-table-converters';
import {resolveReferences} from '../support/parser';
import type {DataTable} from '@cucumber/cucumber';

// ---------------------------------------------------------------------------
// Shared request state (reset per scenario via NestJS app lifecycle)
// ---------------------------------------------------------------------------
type RequestContext = {
    response?: Response;
    headers: Record<string, string>;
};

const requestContext: RequestContext = {
    response: undefined,
    headers: {'Accept-Language': 'pt-BR'},
};

function getResponse(): Response {
    if (!requestContext.response) {
        throw new Error('No HTTP response available. Did you forget to make a request first?');
    }

    return requestContext.response;
}

// ---------------------------------------------------------------------------
// Given — request configuration
// ---------------------------------------------------------------------------

/**
 * Sets a custom request header for subsequent requests in the scenario.
 *
 * Example:
 *   Given I set the header "Accept-Language" to "en-US"
 */
Given('I set the header {string} to {string}', function (_this: Context, header: string, value: string) {
    requestContext.headers[header] = value;
});

/**
 * Resets all custom headers back to defaults.
 */
Given('I reset request headers', function () {
    requestContext.headers = {'Accept-Language': 'pt-BR'};
});

// ---------------------------------------------------------------------------
// When — HTTP requests with a body (DataTable)
// ---------------------------------------------------------------------------

/**
 * Sends an HTTP request with a JSON body built from a vertical DataTable.
 *
 * Example:
 *   When I send a "POST" request to "/api/v1/auth/sign-in" with:
 *     | username | john_doe |
 *     | password | S3cr3t!  |
 */
When(
    'I send a {string} request to {string} with:',
    async function (this: Context, method: string, url: string, table: DataTable) {
        const body = singleEntry(this, table);
        const resolvedUrl = resolveReferences(this, url);

        const response = await (this.agent as any)[method.toLowerCase()](resolvedUrl)
            .set(requestContext.headers)
            .send(body);
        requestContext.response = response;

        this.variables.lastResponse = response.body;
    }
);

/**
 * Sends an HTTP request with query parameters built from a vertical DataTable.
 *
 * Example:
 *   When I send a "GET" request to "/api/v1/user/me" with the query:
 *     | page | 1  |
 *     | size | 10 |
 */
When(
    'I send a {string} request to {string} with the query:',
    async function (this: Context, method: string, url: string, table: DataTable) {
        const query = singleEntry(this, table);
        const resolvedUrl = resolveReferences(this, url);

        const response = await (this.agent as any)[method.toLowerCase()](resolvedUrl)
            .set(requestContext.headers)
            .query(qs.stringify(query, {encode: false}));
        requestContext.response = response;

        this.variables.lastResponse = response.body;
    }
);

// ---------------------------------------------------------------------------
// When — HTTP requests without a body
// ---------------------------------------------------------------------------

/**
 * Sends a simple HTTP request (no body, no query params).
 *
 * Example:
 *   When I send a "GET" request to "/api/v1/user/me"
 *   When I send a "DELETE" request to "/api/v1/user/${ref:id:user:john_doe}"
 */
When(
    'I send a {string} request to {string}',
    async function (this: Context, method: string, url: string) {
        const resolvedUrl = resolveReferences(this, url);

        const response = await (this.agent as any)[method.toLowerCase()](resolvedUrl)
            .set(requestContext.headers);
        requestContext.response = response;

        this.variables.lastResponse = response.body;
    }
);

/**
 * Sends an HTTP request with a raw JSON body string.
 *
 * Example:
 *   When I send a "POST" request to "/api/v1/user/sign-up" with body:
 *     """JSON
 *     {"name": "John", "username": "john", "email": "j@e.com", "password": "P@ss1234"}
 *     """
 */
When(
    'I send a {string} request to {string} with body:',
    async function (this: Context, method: string, url: string, rawBody: string) {
        const resolvedUrl = resolveReferences(this, url);
        const resolvedBody = resolveReferences(this, rawBody.trim());
        const body = JSON.parse(resolvedBody);

        const response = await (this.agent as any)[method.toLowerCase()](resolvedUrl)
            .set(requestContext.headers)
            .send(body);
        requestContext.response = response;

        this.variables.lastResponse = response.body;
    }
);

// ---------------------------------------------------------------------------
// Then — response status assertions
// ---------------------------------------------------------------------------

/**
 * Example:
 *   Then the request should succeed with a 200 status code
 *   Then the request should succeed with a 201 status code
 */
Then('the request should succeed with a {int} status code', function (statusCode: number) {
    const response = getResponse();

    chai.expect(response.status, `Expected HTTP ${statusCode}, got ${response.status}. Body: ${JSON.stringify(response.body)}`).to.equal(statusCode);
});

/**
 * Example:
 *   Then the request should fail with a 400 status code
 */
Then('the request should fail with a {int} status code', function (statusCode: number) {
    const response = getResponse();

    chai.expect(response.status, `Expected HTTP ${statusCode}, got ${response.status}. Body: ${JSON.stringify(response.body)}`).to.equal(statusCode);
});

// ---------------------------------------------------------------------------
// Then — response body assertions
// ---------------------------------------------------------------------------

/**
 * Asserts that the response body matches a JSON pattern.
 * ${ref:...} references are resolved before comparison.
 *
 * Example:
 *   Then the response should match:
 *     """JSON
 *     {"id": "${ref:id:user:john_doe}", "username": "john_doe"}
 *     """
 */
Then('the response should match:', function (this: Context, pattern: string) {
    const response = getResponse();

    this.testMatchPattern(response.body, pattern.trim());
});

/**
 * Asserts that the response body contains a subset of the given properties.
 *
 * Example:
 *   Then the response should contain:
 *     | username | john_doe |
 */
Then('the response should contain:', function (this: Context, table: DataTable) {
    const expected = singleEntry(this, table);
    const response = getResponse();

    chai.expect(response.body).to.containSubset(expected);
});

// ---------------------------------------------------------------------------
// Then — standard error response assertions
// ---------------------------------------------------------------------------

/**
 * Asserts the response is an RFC 7807 "Invalid input" (400) error.
 *
 * Example:
 *   Then I should receive an invalid input error on "email" with reason "Invalid email"
 */
Then(
    'I should receive an invalid input error on {string} with reason {string}',
    function (field: string, reason: string) {
        const response = getResponse();

        chai.expect(response.status).to.equal(400);
        chai.expect(response.body).to.containSubset({
            status: 400,
            violations: [{field, reason}],
        });
    }
);

/**
 * Asserts the response is a 401 Unauthorized error.
 *
 * Example:
 *   Then I should receive an unauthorized error
 */
Then('I should receive an unauthorized error', function () {
    const response = getResponse();

    chai.expect(response.status).to.equal(401);
});

/**
 * Asserts the response is a 403 Forbidden error.
 *
 * Example:
 *   Then I should receive a forbidden error
 */
Then('I should receive a forbidden error', function () {
    const response = getResponse();

    chai.expect(response.status).to.equal(403);
});

/**
 * Asserts the response is a 404 Not Found error.
 *
 * Example:
 *   Then I should receive a not found error
 */
Then('I should receive a not found error', function () {
    const response = getResponse();

    chai.expect(response.status).to.equal(404);
});

// ---------------------------------------------------------------------------
// Then — save response field as variable
// ---------------------------------------------------------------------------

/**
 * Stores a field from the response body as a named variable ID.
 *
 * Example:
 *   Then I save the response field "id" as "user" id for "john_doe"
 */
Then(
    'I save the response field {string} as {string} id for {string}',
    function (this: Context, field: string, idType: string, key: string) {
        const response = getResponse();
        const value = (response.body as Record<string, unknown>)[field];

        chai.expect(value, `Response field "${field}" should exist`).to.be.a('string');

        this.setVariableId(idType, key, value as string);
    }
);
