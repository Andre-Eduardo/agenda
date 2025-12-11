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
 * This function is copied from: https://github.com/anatine/zod-plugins/blob/main/packages/zod-nestjs/src/lib/create-zod-dto.ts
 */
function convertSchemaObject(schemaObject: OpenApiSchema, required?: boolean): void {
    if ('$ref' in schemaObject) {
        return;
    }

    // Recursively convert all sub-schemas
    const subSchemaObjects = [
        ...(schemaObject.allOf ?? []),
        ...(schemaObject.oneOf ?? []),
        ...(schemaObject.anyOf ?? []),
        ...(schemaObject.not ? [schemaObject.not] : []),
        ...(schemaObject.items ? [schemaObject.items] : []),
        ...(typeof schemaObject.additionalProperties === 'object' ? [schemaObject.additionalProperties] : []),
        ...(schemaObject.prefixItems ?? []),
    ];

    for (const subSchemaObject of subSchemaObjects) {
        convertSchemaObject(subSchemaObject);
    }

    for (const [key, subSchemaObject] of Object.entries(schemaObject.properties ?? {})) {
        convertSchemaObject(
            subSchemaObject,
            /**
             * There is no way to determine if a property is required for object in query parameters.
             */
            schemaObject['x-param-object'] ? undefined : schemaObject.required?.includes(key)
        );
    }

    /** For some reason the SchemaObject model has everything except for the
     * required field, which is an array.
     * The NestJS swagger module requires this to be a boolean representative
     * of each property.
     * This logic takes the SchemaObject, and turns the required field from an
     * array to a boolean.
     */
    const convertedSchemaObject = schemaObject as SchemaObjectForMetadataFactory;

    if (required !== undefined) {
        convertedSchemaObject.required = required;
    }
}
