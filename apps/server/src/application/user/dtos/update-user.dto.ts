import {z} from 'zod';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {signUpUserSchema} from './sign-up-user.dto';

const updateUserInputSchema = signUpUserSchema.omit({password: true}).partial().extend({
    currentPassword: z.string(),
});

export class UpdateUserInputDto extends createZodDto(updateUserInputSchema) {}

export const updateUserSchema = updateUserInputSchema.extend({
    id: entityId(UserId),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
