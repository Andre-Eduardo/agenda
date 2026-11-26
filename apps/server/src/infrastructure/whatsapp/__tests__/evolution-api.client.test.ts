import {ConfigService} from '@nestjs/config';
import {WhatsAppConnectionStatus} from '@domain/notification/whatsapp-connection-status';
import {EnvConfigService} from '@infrastructure/config';
import {EvolutionApiClient, EvolutionApiDisabledError, EvolutionApiError} from '../evolution-api.client';

function makeClient(evolutionApi: Record<string, unknown> = {url: 'http://evo/', apiKey: 'secret'}) {
    return new EvolutionApiClient(
        new EnvConfigService(new ConfigService({evolutionApi: {timeoutMs: 5_000, ...evolutionApi}}))
    );
}

describe('An Evolution API client', () => {
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

    beforeEach(() => {
        fetchMock.mockReset();
        globalThis.fetch = fetchMock;
    });

    function lastCall(): {url: string; init: RequestInit} {
        const [url, init] = fetchMock.mock.calls.at(-1) ?? [];

        return {url: String(url), init: init ?? {}};
    }

    it('should report whether it is enabled', () => {
        expect(makeClient().isEnabled).toBe(true);
        expect(makeClient({url: 'http://evo'}).isEnabled).toBe(false);
    });

    it('should refuse to call the API when it is not configured', async () => {
        await expect(makeClient({}).logoutInstance('clinic')).rejects.toBeInstanceOf(EvolutionApiDisabledError);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should create a Baileys instance with a QR code', async () => {
        fetchMock.mockResolvedValue(
            Response.json({
                instance: {instanceName: 'clinic', status: 'connecting'},
                qrcode: {base64: 'data:image/png;base64,AA'},
            })
        );

        await expect(makeClient().createInstance('clinic', '5511987654321')).resolves.toEqual({
            instance: {instanceName: 'clinic', status: WhatsAppConnectionStatus.CONNECTING},
            qrcode: {base64: 'data:image/png;base64,AA'},
        });

        const {url, init} = lastCall();

        expect(url).toBe('http://evo/instance/create');
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({'Content-Type': 'application/json', apikey: 'secret'});
        expect(init.body).toBe(
            JSON.stringify({
                instanceName: 'clinic',
                number: '5511987654321',
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
            })
        );
    });

    it('should get a QR code to connect an instance', async () => {
        fetchMock.mockResolvedValue(Response.json({base64: 'qr', code: 'raw', pairingCode: 'ABCD-1234', count: 1}));

        await expect(makeClient().connectInstance('clinic id')).resolves.toEqual({
            base64: 'qr',
            code: 'raw',
            pairingCode: 'ABCD-1234',
        });
        expect(lastCall().url).toBe('http://evo/instance/connect/clinic%20id');
    });

    it('should get the connection state, treating unknown states as closed', async () => {
        fetchMock.mockResolvedValueOnce(Response.json({instance: {instanceName: 'clinic', state: 'open'}}));
        fetchMock.mockResolvedValueOnce(Response.json({instance: {instanceName: 'clinic', state: 'refused'}}));

        await expect(makeClient().getConnectionState('clinic')).resolves.toBe(WhatsAppConnectionStatus.OPEN);
        await expect(makeClient().getConnectionState('clinic')).resolves.toBe(WhatsAppConnectionStatus.CLOSE);
        expect(lastCall().url).toBe('http://evo/instance/connectionState/clinic');
    });

    it('should fetch instances by name', async () => {
        fetchMock.mockResolvedValue(
            Response.json([{name: 'clinic', connectionStatus: 'open', number: null, ownerJid: '5511@s.whatsapp.net'}])
        );

        await expect(makeClient().fetchInstances('clinic')).resolves.toEqual([
            {
                name: 'clinic',
                connectionStatus: WhatsAppConnectionStatus.OPEN,
                number: null,
                ownerJid: '5511@s.whatsapp.net',
            },
        ]);
        expect(lastCall().url).toBe('http://evo/instance/fetchInstances?instanceName=clinic');
    });

    it('should log out and delete instances', async () => {
        fetchMock.mockResolvedValueOnce(Response.json({status: 'SUCCESS'}));
        fetchMock.mockResolvedValueOnce(new Response(null, {status: 200}));

        await makeClient().logoutInstance('clinic');
        expect(lastCall()).toMatchObject({url: 'http://evo/instance/logout/clinic', init: {method: 'DELETE'}});

        await makeClient().deleteInstance('clinic');
        expect(lastCall()).toMatchObject({url: 'http://evo/instance/delete/clinic', init: {method: 'DELETE'}});
    });

    it('should send a text and return the message id', async () => {
        fetchMock.mockResolvedValueOnce(Response.json({key: {id: 'msg-1'}}));
        fetchMock.mockResolvedValueOnce(Response.json({unexpected: true}));

        await expect(makeClient().sendText('clinic', '5511987654321', 'Oi')).resolves.toBe('msg-1');
        await expect(makeClient().sendText('clinic', '5511987654321', 'Oi')).resolves.toBeUndefined();
        expect(lastCall().init.body).toBe(JSON.stringify({number: '5511987654321', text: 'Oi'}));
    });

    it('should raise the status and body of an error response', async () => {
        fetchMock.mockResolvedValue(new Response('instance not found', {status: 404}));

        const error = await makeClient()
            .deleteInstance('clinic')
            .catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(EvolutionApiError);
        expect(error).toMatchObject({status: 404, message: 'Evolution API error 404: instance not found'});
    });
});
