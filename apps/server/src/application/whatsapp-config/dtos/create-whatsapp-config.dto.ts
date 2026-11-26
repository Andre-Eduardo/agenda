import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {phone} from '@application/@shared/validation/schemas';

export const createWhatsAppConfigSchema = z.object({
    number: phone(),
});

export class CreateWhatsAppConfigDto extends createZodDto(createWhatsAppConfigSchema) {}
