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
     * Omit the `companyId` field from the schema, since we don't want to expose it in the OpenAPI schema as a parameter.
     * The `companyId` will be extracted from the cookies and will be injected into every request.
     */
    /* istanbul ignore next */
    // @ts-expect-error This is a workaround to make the NestJS Swagger module work easily with Zod schemas.
    AugmentedZodDto[METADATA_FACTORY_NAME] = () => generateNestSwaggerSchema(schema, ['companyId']);

    return AugmentedZodDto as unknown as ZodDto<TOutput, TDef, TOutput>;
}

export function isZodDto(value?: unknown): value is ZodDto {
    return value instanceof Object && 'isZodDto' in value && value.isZodDto === true;
}
