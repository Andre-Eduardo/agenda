import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {WhatsAppConnectionStatus} from '@domain/notification/whatsapp-connection-status';
import {EnvConfigService} from '@infrastructure/config';

export class EvolutionApiError extends Error {
    constructor(
        readonly status: number,
        body: string
    ) {
        super(`Evolution API error ${status}: ${body.slice(0, 500)}`);
        this.name = 'EvolutionApiError';
    }
}

export class EvolutionApiDisabledError extends Error {
    constructor() {
        super('Evolution API is not configured');
        this.name = 'EvolutionApiDisabledError';
    }
}

const connectionStatus = z.nativeEnum(WhatsAppConnectionStatus).catch(WhatsAppConnectionStatus.CLOSE);

const qrCodeSchema = z.object({
    pairingCode: z.string().nullish(),
    code: z.string().optional(),
    base64: z.string().optional(),
});

const createInstanceResponseSchema = z.object({
    instance: z.object({
        instanceName: z.string(),
        status: connectionStatus.optional(),
        state: connectionStatus.optional(),
    }),
    qrcode: qrCodeSchema.optional(),
});

const connectionStateResponseSchema = z.object({
    instance: z.object({instanceName: z.string().optional(), state: connectionStatus}),
});

const fetchedInstanceSchema = z.object({
    name: z.string().nullish(),
    connectionStatus: connectionStatus.optional(),
    number: z.string().nullish(),
    ownerJid: z.string().nullish(),
});

const sendTextResponseSchema = z.object({
    key: z.object({id: z.string().optional()}).optional(),
});

export type EvolutionQrCode = z.infer<typeof qrCodeSchema>;
export type EvolutionCreateInstanceResponse = z.infer<typeof createInstanceResponseSchema>;
export type EvolutionFetchedInstance = z.infer<typeof fetchedInstanceSchema>;

type RequestOptions = {
    method: 'GET' | 'POST' | 'DELETE';
    path: string;
    body?: unknown;
};

/**
 * Thin client for the Evolution API (https://doc.evolution-api.com), mirroring the calls plexter
 * uses. Each clinic owns one instance named after its id; instances use the Baileys integration
 * (WhatsApp Web protocol) on a self-hosted Evolution server.
 */
@Injectable()
export class EvolutionApiClient {
    constructor(private readonly config: EnvConfigService) {}

    get isEnabled(): boolean {
        const {url, apiKey} = this.config.evolutionApi;

        return Boolean(url && apiKey);
    }

    async createInstance(instanceName: string, number: string): Promise<EvolutionCreateInstanceResponse> {
        const data = await this.request({
            method: 'POST',
            path: '/instance/create',
            body: {instanceName, number, qrcode: true, integration: 'WHATSAPP-BAILEYS'},
        });

        return createInstanceResponseSchema.parse(data);
    }

    async connectInstance(instanceName: string): Promise<EvolutionQrCode> {
        const data = await this.request({method: 'GET', path: `/instance/connect/${encode(instanceName)}`});

        return qrCodeSchema.parse(data);
    }

    async getConnectionState(instanceName: string): Promise<WhatsAppConnectionStatus> {
        const data = await this.request({method: 'GET', path: `/instance/connectionState/${encode(instanceName)}`});

        return connectionStateResponseSchema.parse(data).instance.state;
    }

    async fetchInstances(instanceName: string): Promise<EvolutionFetchedInstance[]> {
        const data = await this.request({
            method: 'GET',
            path: `/instance/fetchInstances?instanceName=${encode(instanceName)}`,
        });

        return z.array(fetchedInstanceSchema).parse(data);
    }

    async logoutInstance(instanceName: string): Promise<void> {
        await this.request({method: 'DELETE', path: `/instance/logout/${encode(instanceName)}`});
    }

    async deleteInstance(instanceName: string): Promise<void> {
        await this.request({method: 'DELETE', path: `/instance/delete/${encode(instanceName)}`});
    }

    /** Returns the provider message id, when the API reports one. */
    async sendText(instanceName: string, number: string, text: string): Promise<string | undefined> {
        const data = await this.request({
            method: 'POST',
            path: `/message/sendText/${encode(instanceName)}`,
            body: {number, text},
        });
        const parsed = sendTextResponseSchema.safeParse(data);

        return parsed.success ? parsed.data.key?.id : undefined;
    }

    private async request({method, path, body}: RequestOptions): Promise<unknown> {
        const {url, apiKey, timeoutMs} = this.config.evolutionApi;

        if (!url || !apiKey) {
            throw new EvolutionApiDisabledError();
        }

        const response = await fetch(`${url.replace(/\/+$/, '')}${path}`, {
            method,
            headers: {'Content-Type': 'application/json', apikey: apiKey},
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
            throw new EvolutionApiError(response.status, await response.text());
        }

        const text = await response.text();

        return text.length === 0 ? null : JSON.parse(text);
    }
}

function encode(value: string): string {
    return encodeURIComponent(value);
}
