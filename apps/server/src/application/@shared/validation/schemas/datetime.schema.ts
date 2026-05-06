import {z} from 'zod';

export const datetime = z
    .string()
    .datetime()
    .transform((value) => new Date(value))
    .openapi({
        description: 'A datetime in ISO 8601 format.',
        format: 'date-time',
    });
