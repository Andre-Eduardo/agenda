import {Given, Then} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

// ---------------------------------------------------------------------------
// Given — set a named variable for use in later steps
// ---------------------------------------------------------------------------

/**
 * Stores an arbitrary string value under a named variable.
 *
 * Example:
 *   Given I store "some-value" as "myVar"
 */
Given('I store {string} as {string}', function (this: Context, value: string, varName: string) {
    (this.variables as Record<string, unknown>)[varName] = value;
});

// ---------------------------------------------------------------------------
// Then — assertions on context variables
// ---------------------------------------------------------------------------

/**
 * Asserts that a stored variable equals an expected value.
 *
 * Example:
 *   Then the variable "contextId" should exist
 */
Then('the variable {string} should exist', function (this: Context, varName: string) {
    const value = (this.variables as Record<string, unknown>)[varName];

    chai.expect(value, `Variable "${varName}" should exist`).to.not.be.undefined;
});

/**
 * Asserts that a stored ID for a given entity type and key exists.
 *
 * Example:
 *   Then the id for "user" "john_doe" should exist
 */
Then('the id for {string} {string} should exist', function (this: Context, idType: string, key: string) {
    const id = this.variables.ids[idType]?.[key];

    chai.expect(id, `ID for [${idType}] "${key}" should exist`).to.be.a('string').and.not.empty;
});
