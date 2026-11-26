import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {email} from '@application/@shared/validation/schemas';

const requestPasswordResetSchema = z.object({
    email,
});

export class RequestPasswordResetDto extends createZodDto(requestPasswordResetSchema) {}
