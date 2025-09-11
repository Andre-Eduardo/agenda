import {Given, When} from '@cucumber/cucumber';
import * as chai from 'chai';
import * as sinon from 'sinon';
import type {Context} from '../support/context';

let clock: sinon.SinonFakeTimers;

Given('the current date and time is {string}', function (this: Context, dateTime: string) {
    clock = sinon.useFakeTimers({
        now: new Date(dateTime).getTime(),
        toFake: ['Date', 'setTimeout'],
    });
});

When('I wait {int} second(s)', function (this: Context, seconds: number) {
    clockWait(this, 1000 * seconds);
});

When('I wait {int} hour(s)', function (this: Context, hours: number) {
    clockWait(this, hours * 3600 * 1000);
});

When('I wait {int} day(s)', function (this: Context, days: number) {
    clockWait(this, days * 24 * 3600 * 1000);
});

/**
 * This step is useful when you need to wait for async operations to complete when they are outside the request scope.
 */
When(
    'I wait {int} milliseconds for asynchronous operations to complete',
    async function (this: Context, milliseconds: number) {
        await waitFor(this, milliseconds);
    }
);

function clockWait(context: Context, milliseconds: number): void {
    chai.expect(clock).to.exist;
    clock.tick(milliseconds);
    context.clock.increment(milliseconds);
}

/**
 * That's a helper function to wait for a given amount of milliseconds even when the clock setTimeout is faked.
 */
export async function waitFor(context: Context, milliseconds: number): Promise<void> {
    await new Promise((resolve) => {
        chai.expect(clock).to.exist;
        clock.restore();
        clock.tick(milliseconds);
        setTimeout(resolve, milliseconds);
        clock = sinon.useFakeTimers(clock.now);
        context.clock.set(clock.now);
    });
}
