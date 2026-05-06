import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {UserId} from '@domain/user/entities';

const deleteUserInputSchema = z.object({
    password: z.string(),
});

export class DeleteUserInputDto extends createZodDto(deleteUserInputSchema) {}

export const deleteUserSchema = deleteUserInputSchema.extend({
    id: entityId(UserId),
});

export class DeleteUserDto extends createZodDto(deleteUserSchema) {}
