/* eslint-disable @typescript-eslint/no-unsafe-assignment,
    @typescript-eslint/no-unsafe-argument,
    @typescript-eslint/no-unsafe-call,
    @typescript-eslint/no-unsafe-member-access,
    no-underscore-dangle
    -- Needed to work with NestJS Swagger schema */

import {OpenApiGeneratorV3, OpenAPIRegistry} from '@asteasolutions/zod-to-openapi';
import type {SchemaObject as OpenApiSchema} from '@asteasolutions/zod-to-openapi/dist/types';
import type {ApiPropertyOptions} from '@nestjs/swagger';
import type {SchemasObject} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import type {AnyZodObject} from 'zod';

type SchemaObjectForMetadataFactory = ApiPropertyOptions & {
    'x-param-object'?: boolean;
};

export function generateOpenApiSchema(zodDto: AnyZodObject, hideDefinitions?: string[]): OpenApiSchema {
    const filteredSchema = zodDto
        .omit(hideDefinitions?.reduce((acc, key) => ({...acc, [key]: true}), {}) ?? {})
        .openapi({...zodDto._def.openapi?.metadata});

    const refId = 'schema';

    const registry = new OpenAPIRegistry();

    registry.register(refId, filteredSchema);
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateComponents().components.schemas[refId];
}

export function generateNestSwaggerSchema(zodDto: AnyZodObject, hideDefinitions?: string[]): SchemasObject {
    const generatedSchema = generateOpenApiSchema(zodDto, hideDefinitions);

    convertSchemaObject(generatedSchema);

    return generatedSchema.properties;
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
 * Based on: https://github.com/anatine/zod-plugins/blob/main/packages/zod-nestjs/src/lib/create-zod-dto.ts
 */
function convertSchemaObject(schemaObject: OpenApiSchema, required?: boolean): void {
    if ('$ref' in schemaObject) {
        return;
    }

    // Only convert direct properties of the root schema — NestJS reconstructs these into
    // a `required: string[]` array at the parent level. Nested sub-schemas are left alone.
    const properties = (schemaObject.properties ?? {}) as Record<string, OpenApiSchema>;

    for (const [key, subSchemaObject] of Object.entries(properties)) {
        if ('$ref' in subSchemaObject) {
            continue;
        }

        /**
         * There is no way to determine if a property is required for object in query parameters.
         */
        const propRequired = schemaObject['x-param-object']
            ? undefined
            : schemaObject.required?.includes(key);

        if (propRequired !== undefined) {
            (subSchemaObject as SchemaObjectForMetadataFactory).required = propRequired;
        }
    }

    const convertedSchemaObject = schemaObject as SchemaObjectForMetadataFactory;

    if (required !== undefined) {
        convertedSchemaObject.required = required;
    }
}
