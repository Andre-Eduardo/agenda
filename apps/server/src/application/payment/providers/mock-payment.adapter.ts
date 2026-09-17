import {randomUUID} from 'crypto';
import {Injectable} from '@nestjs/common';
import type {
    CreateChargeDto,
    CreateCustomerDto,
    CreateSubscriptionDto,
    ExternalCharge,
    ExternalCustomer,
    ExternalSubscription,
    ExternalSubscriptionStatus,
    IPaymentProvider,
} from '@application/payment/providers/payment-provider.interface';

/**
 * Mock provider for local development and tests when ASAAS_API_KEY is not configured.
 * Mirrors the MockChatProvider/MockEmbeddingProvider pattern in infrastructure/ai-provider —
 * simulates the Asaas API deterministically, no network calls, no real credentials required.
 */
@Injectable()
export class MockPaymentProvider implements IPaymentProvider {
    createCustomer(data: CreateCustomerDto): Promise<ExternalCustomer> {
        return Promise.resolve({id: `mock-cus-${randomUUID()}`, name: data.name, email: data.email});
    }

    createSubscription(data: CreateSubscriptionDto): Promise<ExternalSubscription> {
        return Promise.resolve({
            id: `mock-sub-${randomUUID()}`,
            customerId: data.customerId,
            status: 'ACTIVE',
            nextDueDate: data.nextDueDate,
            value: data.value,
        });
    }

    cancelSubscription(_externalSubscriptionId: string): Promise<void> {
        return Promise.resolve();
    }

    getSubscriptionStatus(externalSubscriptionId: string): Promise<ExternalSubscriptionStatus> {
        return Promise.resolve({
            id: externalSubscriptionId,
            status: 'ACTIVE',
            nextDueDate: new Date().toISOString().slice(0, 10),
        });
    }

    createOneTimeCharge(data: CreateChargeDto): Promise<ExternalCharge> {
        return Promise.resolve({
            id: `mock-pay-${randomUUID()}`,
            status: 'PENDING',
            value: data.value,
            dueDate: data.dueDate,
            invoiceUrl: null,
        });
    }
}
