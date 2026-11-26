import {mock} from 'jest-mock-extended';
import type {Actor} from '@domain/@shared/actor';
import {Phone} from '@domain/@shared/value-objects';
import {WhatsAppConnectionStatus} from '@domain/notification/whatsapp-connection-status';
import type {
    CreateWhatsAppConfigService,
    DeleteWhatsAppConfigService,
    GetWhatsAppConfigService,
    GetWhatsAppQrcodeService,
    LogoutWhatsAppConfigService,
} from '../../services';
import {WhatsAppConfigController} from '../whatsapp-config.controller';

describe('A WhatsApp config controller', () => {
    const actor = mock<Actor>();
    const getService = mock<GetWhatsAppConfigService>();
    const createService = mock<CreateWhatsAppConfigService>();
    const qrcodeService = mock<GetWhatsAppQrcodeService>();
    const logoutService = mock<LogoutWhatsAppConfigService>();
    const deleteService = mock<DeleteWhatsAppConfigService>();
    const controller = new WhatsAppConfigController(
        getService,
        createService,
        qrcodeService,
        logoutService,
        deleteService
    );
    const config = {clinicId: 'clinic', status: WhatsAppConnectionStatus.OPEN, phoneNumber: '5511987654321'};

    it('should get the config', async () => {
        getService.execute.mockResolvedValue([config]);

        await expect(controller.getWhatsAppConfig(actor)).resolves.toEqual([config]);
        expect(getService.execute).toHaveBeenCalledWith({actor, payload: undefined});
    });

    it('should create the config', async () => {
        const payload = {number: Phone.create('11987654321')};

        createService.execute.mockResolvedValue(config);

        await expect(controller.createWhatsAppConfig(actor, payload)).resolves.toEqual(config);
        expect(createService.execute).toHaveBeenCalledWith({actor, payload});
    });

    it('should get a QR code', async () => {
        qrcodeService.execute.mockResolvedValue({base64: 'qr'});

        await expect(controller.getWhatsAppQrcode(actor)).resolves.toEqual({base64: 'qr'});
        expect(qrcodeService.execute).toHaveBeenCalledWith({actor, payload: undefined});
    });

    it('should log out and delete', async () => {
        await controller.logoutWhatsAppConfig(actor);
        await controller.deleteWhatsAppConfig(actor);

        expect(logoutService.execute).toHaveBeenCalledWith({actor, payload: undefined});
        expect(deleteService.execute).toHaveBeenCalledWith({actor, payload: undefined});
    });
});
