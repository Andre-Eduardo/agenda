import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {WhatsAppConnectionStatus} from '@domain/notification/whatsapp-connection-status';

@ApiSchema({name: 'WhatsAppQrCode'})
export class WhatsAppQrCodeDto {
    @ApiProperty({required: false, description: 'QR code image as a data URL (data:image/png;base64,...)'})
    base64?: string;

    @ApiProperty({
        type: String,
        required: false,
        nullable: true,
        description: 'Pairing code to type in WhatsApp instead of scanning',
    })
    pairingCode?: string | null;
}

@ApiSchema({name: 'WhatsAppConfig'})
export class WhatsAppConfigDto {
    @ApiProperty({format: 'uuid', description: 'Clinic that owns the WhatsApp instance'})
    clinicId!: string;

    @ApiProperty({
        description: 'Current connection status of the WhatsApp instance',
        enum: WhatsAppConnectionStatus,
        enumName: 'WhatsAppConnectionStatus',
    })
    status!: WhatsAppConnectionStatus;

    @ApiProperty({type: String, description: 'Phone number paired with the instance', nullable: true})
    phoneNumber!: string | null;

    @ApiProperty({required: false, type: () => WhatsAppQrCodeDto})
    qrcode?: WhatsAppQrCodeDto;
}
