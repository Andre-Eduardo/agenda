import {ConfigService} from '@nestjs/config';
import {ReminderChannel} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import {ClinicId} from '@domain/clinic/entities';
import {EnvConfigService, type EnvConfig} from '@infrastructure/config';
import {EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';
import {EvolutionWhatsAppProvider} from '../evolution-whatsapp.provider';

const clinicId = ClinicId.generate();

function makeProvider(evolutionApi: Partial<EnvConfig['evolutionApi']>): EvolutionWhatsAppProvider {
    const config = new EnvConfigService(new ConfigService({evolutionApi: {timeoutMs: 5_000, ...evolutionApi}}));

    return new EvolutionWhatsAppProvider(new EvolutionApiClient(config));
}

function jsonResponse(status: number, body: unknown): Response {
    return Response.json(body, {status});
}

describe('An Evolution API WhatsApp provider', () => {
    const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

    beforeEach(() => {
        fetchMock.mockReset();
        globalThis.fetch = fetchMock;
    });

    it('should serve the WhatsApp channel', () => {
        expect(makeProvider({}).channel).toBe(ReminderChannel.WHATSAPP);
    });

    it.each([
        ['11987654321', '5511987654321'],
        ['(11) 3456-7890', '551134567890'],
        ['5511987654321', '5511987654321'],
        ['+1 202 555 0143', '12025550143'],
    ])('should normalize %s to %s', (input, expected) => {
        expect(EvolutionWhatsAppProvider.toWhatsAppNumber(input)).toBe(expected);
    });

    it('should send the text to the clinic instance by default', async () => {
        fetchMock.mockResolvedValue(jsonResponse(201, {key: {id: 'msg-1', remoteJid: 'x', fromMe: true}}));

        const provider = makeProvider({url: 'http://evo:8080/', apiKey: 'secret'});

        await expect(provider.send({clinicId, to: '11987654321', message: 'Olá!'})).resolves.toEqual({
            success: true,
            providerId: 'msg-1',
        });

        expect(fetchMock).toHaveBeenCalledWith(
            `http://evo:8080/message/sendText/${clinicId.toString()}`,
            expect.objectContaining({
                method: 'POST',
                headers: {'Content-Type': 'application/json', apikey: 'secret'},
                body: JSON.stringify({number: '5511987654321', text: 'Olá!'}),
            })
        );
    });

    it('should return a failure when the API answers with an error status', async () => {
        fetchMock.mockResolvedValue(new Response('{"message":"instance not found"}', {status: 404}));

        const provider = makeProvider({url: 'http://evo', apiKey: 'secret'});

        await expect(provider.send({clinicId, to: '11987654321', message: 'Olá!'})).resolves.toEqual({
            success: false,
            error: 'Evolution API error 404: {"message":"instance not found"}',
        });
    });

    it('should return a failure instead of throwing when the request fails', async () => {
        fetchMock.mockRejectedValue(new TypeError('fetch failed'));

        const provider = makeProvider({url: 'http://evo', apiKey: 'secret'});

        await expect(provider.send({clinicId, to: '11987654321', message: 'Olá!'})).resolves.toEqual({
            success: false,
            error: 'Evolution API request failed: TypeError: fetch failed',
        });
    });

    it('should return a failure when it is not configured', async () => {
        const provider = makeProvider({});

        await expect(provider.send({clinicId, to: '11987654321', message: 'Olá!'})).resolves.toEqual({
            success: false,
            error: 'Evolution API request failed: EvolutionApiDisabledError: Evolution API is not configured',
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
