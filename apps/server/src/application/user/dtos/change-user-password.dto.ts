import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';
import {password} from '../../@shared/validation/schemas';

const changeUserPasswordSchema = z.object({
    oldPassword: z.string().min(1).openapi({example: 'J0hn@d02'}),
    newPassword: password,
});

export class ChangeUserPasswordDto extends createZodDto(changeUserPasswordSchema) {}
