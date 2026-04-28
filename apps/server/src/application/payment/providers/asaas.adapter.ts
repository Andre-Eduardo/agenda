import {Injectable, Logger} from '@nestjs/common';
import {EnvConfigService} from '../../../infrastructure/config';
import {
    BillingType,
    CreateChargeDto,
    CreateCustomerDto,
    CreateSubscriptionDto,
    ExternalCharge,
    ExternalCustomer,
    ExternalSubscription,
    ExternalSubscriptionStatus,
    IPaymentProvider,
} from './payment-provider.interface';

type AsaasCustomerResponse = {
    id: string;
    name: string;
    email: string;
};

type AsaasSubscriptionResponse = {
    id: string;
    customer: string;
    status: string;
    nextDueDate: string;
    value: number;
};

type AsaasChargeResponse = {
    id: string;
    status: string;
    value: number;
    dueDate: string;
    invoiceUrl: string | null;
};

@Injectable()
export class AsaasPaymentAdapter implements IPaymentProvider {
    private readonly logger = new Logger(AsaasPaymentAdapter.name);
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(private readonly configService: EnvConfigService) {
        const {apiKey, env} = this.configService.asaas;

        this.apiKey = apiKey;
        this.baseUrl =
            env === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                access_token: this.apiKey,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const body = await response.text();

            this.logger.error(`Asaas API error [${response.status}] ${path}: ${body}`);
            throw new Error(`Asaas API error ${response.status}: ${body}`);
        }

        return response.json() as Promise<T>;
    }

    async createCustomer(data: CreateCustomerDto): Promise<ExternalCustomer> {
        const result = await this.request<AsaasCustomerResponse>('/customers', {
            method: 'POST',
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                mobilePhone: data.phone,
                cpfCnpj: data.cpfCnpj,
            }),
        });

        return {id: result.id, name: result.name, email: result.email};
    }

    async createSubscription(data: CreateSubscriptionDto): Promise<ExternalSubscription> {
        const result = await this.request<AsaasSubscriptionResponse>('/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                customer: data.customerId,
                billingType: data.billingType,
                value: data.value,
                nextDueDate: data.nextDueDate,
                cycle: data.cycle,
                description: data.description,
            }),
        });

        return {
            id: result.id,
            customerId: result.customer,
            status: result.status,
            nextDueDate: result.nextDueDate,
            value: result.value,
        };
    }

    async cancelSubscription(externalSubscriptionId: string): Promise<void> {
        await this.request(`/subscriptions/${externalSubscriptionId}`, {method: 'DELETE'});
    }

    async getSubscriptionStatus(externalSubscriptionId: string): Promise<ExternalSubscriptionStatus> {
        const result = await this.request<AsaasSubscriptionResponse>(
            `/subscriptions/${externalSubscriptionId}`,
        );

        return {id: result.id, status: result.status, nextDueDate: result.nextDueDate};
    }

    async createOneTimeCharge(data: CreateChargeDto): Promise<ExternalCharge> {
        const result = await this.request<AsaasChargeResponse>('/payments', {
            method: 'POST',
            body: JSON.stringify({
                customer: data.customerId,
                billingType: data.billingType,
                value: data.value,
                dueDate: data.dueDate,
                description: data.description,
            }),
        });

        return {
            id: result.id,
            status: result.status,
            value: result.value,
            dueDate: result.dueDate,
            invoiceUrl: result.invoiceUrl,
        };
    }

    buildBillingType(method: string): BillingType {
        const map: Record<string, BillingType> = {
            CREDIT_CARD: 'CREDIT_CARD',
            PIX: 'PIX',
            BOLETO: 'BOLETO',
        };

        return map[method] ?? 'PIX';
    }
}
