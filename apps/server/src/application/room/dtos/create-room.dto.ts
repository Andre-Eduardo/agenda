import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';

export const createRoomSchema = z.object({
    name: z.string().min(1).max(255),
});

export class CreateRoomDto extends createZodDto(createRoomSchema) {}
