import {After, Before, setDefaultTimeout, setWorldConstructor} from '@cucumber/cucumber';
import * as sinon from 'sinon';
import {Context} from './context';

setWorldConstructor(Context);

setDefaultTimeout(20 * 1000);

Before({name: 'Setup server'}, async function (this: Context) {
    await this.start();
});

After({name: 'Teardown server'}, async function (this: Context) {
    sinon.restore();
    await this.stop();
});
