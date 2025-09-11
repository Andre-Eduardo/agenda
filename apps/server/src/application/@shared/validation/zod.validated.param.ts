import {Param} from '@nestjs/common';
import type {ZodSchema} from 'zod';
import {ZodValidationPipe} from './zod.validation.pipe';

export function ValidatedParam(property: string, schema: ZodSchema): ParameterDecorator {
    return Param(property, new ZodValidationPipe(schema));
}
