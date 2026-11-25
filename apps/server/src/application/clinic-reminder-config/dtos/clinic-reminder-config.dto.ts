import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {EntityDto} from '@application/@shared/dto';
import {createZodDto} from '@application/@shared/validation/dto';
import {ReminderChannel} from '@domain/appointment-reminder/entities';
import type {ClinicReminderConfig} from '@domain/clinic-reminder-config/entities';
import {
    DEFAULT_REMINDER_MESSAGE_TEMPLATE,
    REMINDER_CONFIG_LIMITS,
    ReminderTemplateVariable,
    findUnknownReminderVariables,
} from '@domain/clinic-reminder-config/reminder-message-template';

const limits = REMINDER_CONFIG_LIMITS;

const messageTemplateSchema = z
    .string()
    .max(limits.maxTemplateLength)
    .refine((template) => findUnknownReminderVariables(template).length === 0, {
        message: `Use only the variables ${Object.values(ReminderTemplateVariable)
            .map((name) => `{{${name}}}`)
            .join(', ')}.`,
    });

export const upsertReminderConfigSchema = z.object({
    enabledChannels: z
        .array(
            z.nativeEnum(ReminderChannel).refine((channel) => limits.supportedChannels.includes(channel), {
                message: 'Channel not supported yet.',
            })
        )
        .min(1),
    hoursBeforeList: z
        .array(z.number().int().min(limits.minHoursBefore).max(limits.maxHoursBefore))
        .min(1)
        .max(limits.maxLeadTimes),
    /** Omit to keep the current text; `null` or blank goes back to the default text. */
    messageTemplate: messageTemplateSchema.nullish(),
    isActive: z.boolean().optional(),
});

export class UpsertReminderConfigDto extends createZodDto(upsertReminderConfigSchema) {}

export const previewReminderMessageSchema = z.object({
    /** Blank previews the default text. */
    messageTemplate: messageTemplateSchema.nullish(),
});

export class PreviewReminderMessageDto extends createZodDto(previewReminderMessageSchema) {}

@ApiSchema({name: 'ClinicReminderConfig'})
export class ClinicReminderConfigDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({enum: ReminderChannel, isArray: true})
    enabledChannels: ReminderChannel[];

    @ApiProperty({type: [Number], description: 'Hours before the appointment, largest first'})
    hoursBeforeList: number[];

    @ApiProperty({description: 'Reminder text in use (the default text when the clinic has not customized it)'})
    messageTemplate: string;

    @ApiProperty({description: 'Whether the clinic is using the default text'})
    usesDefaultTemplate: boolean;

    @ApiProperty({description: 'Default reminder text, used when the clinic saves no custom text'})
    defaultMessageTemplate: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty({description: 'False while the clinic has never saved its reminder settings'})
    configured: boolean;

    constructor(config: ClinicReminderConfig, configured = true) {
        super(config);
        this.clinicId = config.clinicId.toString();
        this.enabledChannels = config.enabledChannels;
        this.hoursBeforeList = config.hoursBeforeList;
        this.messageTemplate = config.resolveMessageTemplate();
        this.usesDefaultTemplate = config.messageTemplate === null;
        this.defaultMessageTemplate = DEFAULT_REMINDER_MESSAGE_TEMPLATE;
        this.isActive = config.isActive;
        this.configured = configured;
    }
}

@ApiSchema({name: 'ReminderMessagePreview'})
export class ReminderMessagePreviewDto {
    @ApiProperty({description: 'E-mail subject'})
    subject: string;

    @ApiProperty({description: 'Message as the patient would receive it, filled with sample data'})
    message: string;

    @ApiProperty({enum: ReminderTemplateVariable, isArray: true, description: 'Variables the text can use'})
    variables: ReminderTemplateVariable[];

    constructor(subject: string, message: string) {
        this.subject = subject;
        this.message = message;
        this.variables = Object.values(ReminderTemplateVariable);
    }
}
