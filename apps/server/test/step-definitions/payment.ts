import {Given} from '@cucumber/cucumber';
import sinon from 'sinon';
import {EnvConfigService} from '../../src/infrastructure/config';
import type {Context} from '../support/context';

/**
 * Stubs the Asaas webhook token so the webhook endpoint can be tested without
 * a real Asaas configuration. Automatically restored after each scenario by
 * the sinon.restore() call in the After hook (setup.ts).
 *
 * Example:
 *   Given the Asaas webhook token is "test-webhook-token"
 */
Given('the Asaas webhook token is {string}', function (this: Context, token: string) {
    const configService = this.app.get(EnvConfigService);

    sinon.stub(configService, 'asaas').get(() => ({
        apiKey: '',
        env: 'sandbox' as const,
        webhookToken: token,
    }));
});
