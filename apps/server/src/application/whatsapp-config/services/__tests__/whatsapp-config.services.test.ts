import {mock} from 'jest-mock-extended';
import type {Actor} from '@domain/@shared/actor';
import {PreconditionException} from '@domain/@shared/exceptions';
import {Phone} from '@domain/@shared/value-objects';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {WhatsAppConfigExceptions} from '@domain/notification/notification.exceptions';
import {WhatsAppConnectionStatus} from '@domain/notification/whatsapp-connection-status';
import {UserId} from '@domain/user/entities';
import {EvolutionApiClient, EvolutionApiError} from '@infrastructure/whatsapp/evolution-api.client';
import {
    ConfigureWhatsAppWebhookService,
    CreateWhatsAppConfigService,
    DeleteWhatsAppConfigService,
    GetWhatsAppConfigService,
    GetWhatsAppQrcodeService,
    LogoutWhatsAppConfigService,
} from '..';

describe('The WhatsApp config services', () => {
    const clinicId = ClinicId.generate();
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId,
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const instanceName = clinicId.toString();
    const client = mock<EvolutionApiClient>();
    const webhook = mock<ConfigureWhatsAppWebhookService>();

    function enable(enabled: boolean): void {
        Object.defineProperty(client, 'isEnabled', {get: () => enabled, configurable: true});
    }

    beforeEach(() => {
        jest.resetAllMocks();
        enable(true);
    });

    describe('getting the config', () => {
        const service = new GetWhatsAppConfigService(client);

        it('should return the clinic instance', async () => {
            client.fetchInstances.mockResolvedValue([
                {
                    name: instanceName,
                    connectionStatus: WhatsAppConnectionStatus.OPEN,
                    ownerJid: '5511987654321@s.whatsapp.net',
                },
                {name: 'another-clinic', connectionStatus: WhatsAppConnectionStatus.OPEN, number: '5511000000000'},
            ]);

            await expect(service.execute({actor, payload: undefined})).resolves.toEqual([
                {clinicId: instanceName, status: WhatsAppConnectionStatus.OPEN, phoneNumber: '5511987654321'},
            ]);
            expect(client.fetchInstances).toHaveBeenCalledWith(instanceName);
        });

        it('should default the status to closed and use the instance number', async () => {
            client.fetchInstances.mockResolvedValue([{name: instanceName, number: '5511987654321'}]);

            await expect(service.execute({actor, payload: undefined})).resolves.toEqual([
                {clinicId: instanceName, status: WhatsAppConnectionStatus.CLOSE, phoneNumber: '5511987654321'},
            ]);
        });

        it('should return no instance when Evolution is disabled or the instance does not exist', async () => {
            client.fetchInstances.mockRejectedValue(new EvolutionApiError(404, 'not found'));
            await expect(service.execute({actor, payload: undefined})).resolves.toEqual([]);

            client.fetchInstances.mockResolvedValue([{name: instanceName}]);
            enable(false);
            await expect(service.execute({actor, payload: undefined})).resolves.toEqual([]);
        });

        it('should fail when Evolution is unreachable', async () => {
            client.fetchInstances.mockRejectedValue(new TypeError('fetch failed'));

            await expect(service.execute({actor, payload: undefined})).rejects.toThrowWithMessage(
                PreconditionException,
                WhatsAppConfigExceptions.fetch_failed
            );
        });
    });

    describe('creating the config', () => {
        const service = new CreateWhatsAppConfigService(client, webhook);
        const payload = {number: Phone.create('11987654321')};

        it('should create the clinic instance with the full number and return its QR code', async () => {
            client.createInstance.mockResolvedValue({
                instance: {instanceName, status: WhatsAppConnectionStatus.CONNECTING},
                qrcode: {base64: 'qr', pairingCode: 'ABCD'},
            });

            await expect(service.execute({actor, payload})).resolves.toEqual({
                clinicId: instanceName,
                status: WhatsAppConnectionStatus.CONNECTING,
                phoneNumber: '5511987654321',
                qrcode: {base64: 'qr', pairingCode: 'ABCD'},
            });
            expect(client.createInstance).toHaveBeenCalledWith(instanceName, '5511987654321');
            expect(webhook.configure).toHaveBeenCalledWith(clinicId);
        });

        it('should fall back to the state field and to connecting', async () => {
            client.createInstance.mockResolvedValueOnce({
                instance: {instanceName, state: WhatsAppConnectionStatus.CLOSE},
            });
            client.createInstance.mockResolvedValueOnce({instance: {instanceName}});

            await expect(service.execute({actor, payload})).resolves.toMatchObject({
                status: WhatsAppConnectionStatus.CLOSE,
                qrcode: undefined,
            });
            await expect(service.execute({actor, payload})).resolves.toMatchObject({
                status: WhatsAppConnectionStatus.CONNECTING,
            });
        });

        it('should fail when Evolution is disabled', async () => {
            enable(false);

            await expect(service.execute({actor, payload})).rejects.toThrowWithMessage(
                PreconditionException,
                WhatsAppConfigExceptions.disabled
            );
            expect(client.createInstance).not.toHaveBeenCalled();
        });

        it('should fail when Evolution rejects the instance', async () => {
            client.createInstance.mockRejectedValue(new EvolutionApiError(403, 'name in use'));

            await expect(service.execute({actor, payload})).rejects.toThrowWithMessage(
                PreconditionException,
                WhatsAppConfigExceptions.create_failed
            );
        });
    });

    describe('getting a QR code', () => {
        const service = new GetWhatsAppQrcodeService(client, webhook);

        it('should return a fresh QR code for the clinic instance', async () => {
            client.connectInstance.mockResolvedValue({base64: 'qr', code: 'raw', pairingCode: null});

            await expect(service.execute({actor, payload: undefined})).resolves.toEqual({
                base64: 'qr',
                pairingCode: null,
            });
            expect(client.connectInstance).toHaveBeenCalledWith(instanceName);
            expect(webhook.configure).toHaveBeenCalledWith(clinicId);
        });

        it('should fail when Evolution fails', async () => {
            client.connectInstance.mockRejectedValue('boom');

            await expect(service.execute({actor, payload: undefined})).rejects.toThrowWithMessage(
                PreconditionException,
                WhatsAppConfigExceptions.connect_failed
            );
        });
    });

    describe('logging out', () => {
        const service = new LogoutWhatsAppConfigService(client);

        it('should log out the clinic instance', async () => {
            await service.execute({actor, payload: undefined});

            expect(client.logoutInstance).toHaveBeenCalledWith(instanceName);
        });

        it('should fail when Evolution fails', async () => {
            client.logoutInstance.mockRejectedValue(new EvolutionApiError(400, 'not connected'));

            await expect(service.execute({actor, payload: undefined})).rejects.toThrowWithMessage(
                PreconditionException,
                WhatsAppConfigExceptions.logout_failed
            );
        });
    });

    describe('deleting the config', () => {
        const service = new DeleteWhatsAppConfigService(client);

        it('should delete the clinic instance and ignore one that no longer exists', async () => {
            await service.execute({actor, payload: undefined});
            expect(client.deleteInstance).toHaveBeenCalledWith(instanceName);

            client.deleteInstance.mockRejectedValue(new EvolutionApiError(404, 'not found'));
            await expect(service.execute({actor, payload: undefined})).resolves.toBeUndefined();
        });

        it('should fail when Evolution fails', async () => {
            client.deleteInstance.mockRejectedValue(new EvolutionApiError(500, 'error'));

            await expect(service.execute({actor, payload: undefined})).rejects.toThrowWithMessage(
                PreconditionException,
                WhatsAppConfigExceptions.delete_failed
            );
        });
    });
});
