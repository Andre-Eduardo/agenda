import {extendZodWithOpenApi} from '@asteasolutions/zod-to-openapi';
import {METADATA_FACTORY_NAME} from '@nestjs/swagger/dist/plugin/plugin-constants';
import {z} from 'zod';
import type {ZodSchema, ZodTypeDef} from 'zod';
import {generateNestSwaggerSchema} from '../../../../infrastructure/openapi';

extendZodWithOpenApi(z);

export interface ZodDto<TOutput = unknown, TDef extends ZodTypeDef = ZodTypeDef, TInput = TOutput> {
    isZodDto: true;
    schema: ZodSchema<TOutput, TDef, TInput>;
    new (): TOutput;
}

export function createZodDto<TOutput = unknown, TDef extends ZodTypeDef = ZodTypeDef, TInput = TOutput>(
    schema: ZodSchema<TOutput, TDef, TInput>
): ZodDto<TOutput, TDef, TOutput> {
    class AugmentedZodDto {
        static readonly isZodDto = true;
        static readonly schema = schema;
    }

    /**
     * Omit tenant-injected fields from the schema — they are populated by
     * RequestContextMiddleware from signed cookies and should never appear
     * as request parameters in OpenAPI.
     */
    /* istanbul ignore next */
    // @ts-expect-error Workaround so NestJS Swagger plays nicely with Zod schemas.
    AugmentedZodDto[METADATA_FACTORY_NAME] = () => generateNestSwaggerSchema(schema, ['clinicId', 'clinicMemberId']);

    return AugmentedZodDto as unknown as ZodDto<TOutput, TDef, TOutput>;
}

export function isZodDto(value?: unknown): value is ZodDto {
    return value instanceof Object && 'isZodDto' in value && value.isZodDto === true;
}
