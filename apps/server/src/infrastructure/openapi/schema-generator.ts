import {OpenApiGeneratorV3, OpenAPIRegistry} from '@asteasolutions/zod-to-openapi';
import type {ApiPropertyOptions} from '@nestjs/swagger';
import type {AnyZodObject} from 'zod';

// Derive schema types from the V3 generator to ensure openapi30/openapi31 consistency
type OpenApiComponents = NonNullable<ReturnType<OpenApiGeneratorV3['generateComponents']>['components']>;
type OpenApiSchemas = NonNullable<OpenApiComponents['schemas']>;
type SchemaOrRef = OpenApiSchemas[string];
type OpenApiSchema = Exclude<SchemaOrRef, {$ref: string}>;

type SchemaObjectForMetadataFactory = ApiPropertyOptions & {
    'x-param-object'?: boolean;
};

function isSchemaObject(obj: SchemaOrRef | undefined): obj is OpenApiSchema {
    return obj !== undefined && !('$ref' in obj);
}

export function generateOpenApiSchema(zodDto: AnyZodObject, hideDefinitions?: string[]): OpenApiSchema {
    const hideKeys = hideDefinitions?.reduce((acc, key) => ({...acc, [key]: true}), {}) ?? {};
    const canOmit = typeof (zodDto as unknown as Record<string, unknown>).omit === 'function';
    const filteredSchema = canOmit
        ? zodDto.omit(hideKeys).openapi({...zodDto._def.openapi?.metadata})
        : zodDto.openapi({...zodDto._def.openapi?.metadata});

    const refId = 'schema';

    const registry = new OpenAPIRegistry();

    registry.register(refId, filteredSchema);
    const generator = new OpenApiGeneratorV3(registry.definitions);

    const schema = generator.generateComponents().components?.schemas?.[refId];
    if (!isSchemaObject(schema)) {
        throw new Error(`Expected SchemaObject for key '${refId}'`);
    }
    return schema;
}

export function generateNestSwaggerSchema(zodDto: AnyZodObject, hideDefinitions?: string[]): OpenApiSchemas {
    const hideKeys = hideDefinitions?.reduce((acc, key) => ({...acc, [key]: true}), {}) ?? {};
    const canOmit = typeof (zodDto as unknown as Record<string, unknown>).omit === 'function';
    const filteredSchema = canOmit
        ? zodDto.omit(hideKeys).openapi({...zodDto._def.openapi?.metadata})
        : zodDto.openapi({...zodDto._def.openapi?.metadata});

    const refId = 'schema';

    const registry = new OpenAPIRegistry();

    registry.register(refId, filteredSchema);
    const generator = new OpenApiGeneratorV3(registry.definitions);
    const allSchemas = generator.generateComponents().components?.schemas ?? {};

    const generatedSchema = allSchemas[refId];
    if (!isSchemaObject(generatedSchema)) {
        throw new Error(`Expected SchemaObject for key '${refId}'`);
    }

    convertSchemaObject(generatedSchema, allSchemas);

    return generatedSchema.properties ?? {};
}

/**
 * Convert a SchemaObject to a format that can be used by the NestJS Swagger module.
 * This function modifies the SchemaObject in place.
 *
 * NestJS's METADATA_FACTORY_NAME output is reconstructed with `required` as a boolean
 * per top-level property — but only for the direct properties of the DTO class. Nested
 * sub-schemas (array items, allOf/oneOf/anyOf, additionalProperties) are emitted verbatim,
 * so they must retain OpenAPI's `required: string[]` array form to stay spec-compliant.
 *
 * $ref pointers in direct properties are resolved inline so NestJS Swagger never sees
 * them — it would otherwise try to look up the ref name as a class type and fail with
 * a circular-dependency error when the name matches an enum value.
 *
 * Based on: https://github.com/anatine/zod-plugins/blob/main/packages/zod-nestjs/src/lib/create-zod-dto.ts
 */
function convertSchemaObject(
    schemaObject: OpenApiSchema,
    allSchemas: OpenApiSchemas = {},
    required?: boolean
): void {
    if ('$ref' in schemaObject) {
        return;
    }

    // Only convert direct properties of the root schema — NestJS reconstructs these into
    // a `required: string[]` array at the parent level. Nested sub-schemas are left alone.
    const properties = (schemaObject.properties ?? {}) as Record<string, OpenApiSchema>;

    for (const [key, subSchemaObject] of Object.entries(properties)) {
        if ('$ref' in subSchemaObject) {
            // Resolve the $ref inline so NestJS Swagger receives a plain schema instead
            // of a $ref pointer it cannot dereference without the full component registry.
            const refName = (subSchemaObject.$ref as string).split('/').pop() ?? '';
            const resolved = allSchemas[refName];

            if (isSchemaObject(resolved)) {
                properties[key] = {...resolved};
            }

            continue;
        }

        /**
         * There is no way to determine if a property is required for object in query parameters.
         */
        const propRequired = schemaObject['x-param-object'] ? undefined : schemaObject.required?.includes(key);

        if (propRequired !== undefined) {
            (subSchemaObject as SchemaObjectForMetadataFactory).required = propRequired;
        }
    }

    const convertedSchemaObject = schemaObject as SchemaObjectForMetadataFactory;

    if (required !== undefined) {
        convertedSchemaObject.required = required;
    }
}
