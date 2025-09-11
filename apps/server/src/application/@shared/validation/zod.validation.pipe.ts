import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';
import {ZodSchema} from 'zod';
import {isZodDto, ZodDto} from './dto';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly schemaValidation?: ZodSchema | ZodDto) {}

    transform(value: unknown, metadata: ArgumentMetadata): unknown {
        if (this.schemaValidation) {
            return isZodDto(this.schemaValidation)
                ? this.schemaValidation.schema.parse(value)
                : this.schemaValidation.parse(value, {
                      path: ['query', 'param'].includes(metadata.type) && metadata.data ? [metadata.data] : undefined,
                  });
        }

        const {metatype} = metadata;

        if (!isZodDto(metatype)) {
            return value;
        }

        return metatype.schema.parse(value);
    }
}
