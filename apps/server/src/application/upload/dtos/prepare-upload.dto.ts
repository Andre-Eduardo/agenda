import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';

export const prepareUploadSchema = z.object({
    filename: z.string().min(1).openapi({example: 'report.pdf'}),
    mimeType: z.string().min(1).openapi({example: 'application/pdf'}),
    size: z.coerce.number().positive().openapi({example: 102_400}),
    checksum: z.string().optional().openapi({example: 'abc123'}),
});

export type PrepareUploadDto = z.infer<typeof prepareUploadSchema>;

export class PrepareUploadInputDto extends createZodDto(prepareUploadSchema) {}
