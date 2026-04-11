import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';
import type {FormDefinitionJson} from '../../../domain/form-template/types';

const formFieldSchema: z.ZodType<object> = z.object({
    id: z.string().min(1),
    type: z.enum([
        'text', 'textarea', 'number', 'date', 'datetime',
        'select', 'multiselect', 'radio', 'checkbox', 'boolean',
        'file', 'score', 'computed',
    ]),
    label: z.string().min(1),
    order: z.number().int().nonnegative(),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    unit: z.string().optional(),
    options: z.array(z.object({
        value: z.string(),
        label: z.string(),
        score: z.number().optional(),
    })).optional(),
    repeatable: z.boolean().optional(),
    validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        minLength: z.number().int().optional(),
        maxLength: z.number().int().optional(),
        pattern: z.string().optional(),
        message: z.string().optional(),
    }).optional(),
    ui: z.object({
        width: z.enum(['full', 'half', 'third']).optional(),
        hint: z.string().optional(),
        tooltip: z.string().optional(),
    }).optional(),
});

const formSectionSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    order: z.number().int().nonnegative(),
    description: z.string().optional(),
    repeatable: z.boolean().optional(),
    fields: z.array(formFieldSchema).min(1),
});

const definitionJsonSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    specialty: z.string().min(1),
    category: z.string().optional(),
    sections: z.array(formSectionSchema).min(1),
    scoring: z.object({
        enabled: z.boolean(),
        totalFieldId: z.string().optional(),
        rules: z.array(z.any()).optional(),
    }).optional(),
    metadata: z.record(z.unknown()).optional(),
}) satisfies z.ZodType<FormDefinitionJson>;

const createFormTemplateVersionSchema = z.object({
    definitionJson: definitionJsonSchema,
    schemaJson: z.record(z.unknown()).nullish(),
});

export class CreateFormTemplateVersionInputDto extends createZodDto(createFormTemplateVersionSchema) {}

export type CreateFormTemplateVersionDto = z.infer<typeof createFormTemplateVersionSchema>;
