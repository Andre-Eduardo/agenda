import {Given} from '@cucumber/cucumber';
import type {Context} from '../support/context';
import {parseValue} from '../support/parser';

Given('{string} is defined as:', function (this: Context, variableName: string, value: string) {
    this.setVariable(variableName, parseValue(this, value));
});
