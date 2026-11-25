import {AggregateRoot, type AllEntityProps, type EntityJson} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {InvalidInputException} from '@domain/@shared/exceptions';
import {ReminderChannel} from '@domain/appointment-reminder/entities';
import {
    DEFAULT_REMINDER_MESSAGE_TEMPLATE,
    REMINDER_CONFIG_LIMITS,
    findUnknownReminderVariables,
} from '@domain/clinic-reminder-config/reminder-message-template';
import type {ClinicId} from '@domain/clinic/entities';

export type CreateClinicReminderConfig = {
    clinicId: ClinicId;
    enabledChannels: ReminderChannel[];
    hoursBeforeList: number[];
    messageTemplate?: string | null;
    isActive?: boolean;
};

export type ConfigureClinicReminderConfig = {
    enabledChannels?: ReminderChannel[];
    hoursBeforeList?: number[];
    /** `null` (or blank) goes back to the default text. */
    messageTemplate?: string | null;
    isActive?: boolean;
};

/**
 * How a clinic reminds patients of their appointments: channels, lead times, text and on/off.
 * Channels, lead times and on/off are read when an appointment is created, so a change applies to
 * appointments created afterwards; the text is read when each reminder is sent.
 */
export class ClinicReminderConfig extends AggregateRoot<ClinicReminderConfigId> {
    clinicId: ClinicId;
    enabledChannels: ReminderChannel[];
    hoursBeforeList: number[];
    /** Custom text; `null` means {@link DEFAULT_REMINDER_MESSAGE_TEMPLATE}. */
    messageTemplate: string | null;
    isActive: boolean;

    constructor(props: AllEntityProps<ClinicReminderConfig>) {
        super(props);
        this.clinicId = props.clinicId;
        this.enabledChannels = props.enabledChannels;
        this.hoursBeforeList = props.hoursBeforeList;
        this.messageTemplate = props.messageTemplate ?? null;
        this.isActive = props.isActive;
    }

    static create(props: CreateClinicReminderConfig): ClinicReminderConfig {
        const id = ClinicReminderConfigId.generate();
        const now = new Date();

        const config = new ClinicReminderConfig({
            id,
            clinicId: props.clinicId,
            enabledChannels: uniqueChannels(props.enabledChannels),
            hoursBeforeList: sortedLeadTimes(props.hoursBeforeList),
            messageTemplate: normalizeTemplate(props.messageTemplate),
            isActive: props.isActive ?? true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        config.validate();

        return config;
    }

    /** What a clinic that never saved its settings gets: WhatsApp 24 h before, default text, off. */
    static defaultFor(clinicId: ClinicId): ClinicReminderConfig {
        return ClinicReminderConfig.create({
            clinicId,
            enabledChannels: [ReminderChannel.WHATSAPP],
            hoursBeforeList: [24],
            messageTemplate: null,
            isActive: false,
        });
    }

    resolveMessageTemplate(): string {
        return this.messageTemplate ?? DEFAULT_REMINDER_MESSAGE_TEMPLATE;
    }

    configure(props: ConfigureClinicReminderConfig): void {
        if (props.enabledChannels !== undefined) {
            this.enabledChannels = uniqueChannels(props.enabledChannels);
        }

        if (props.hoursBeforeList !== undefined) {
            this.hoursBeforeList = sortedLeadTimes(props.hoursBeforeList);
        }

        if (props.messageTemplate !== undefined) {
            this.messageTemplate = normalizeTemplate(props.messageTemplate);
        }

        if (props.isActive !== undefined) {
            this.isActive = props.isActive;
        }

        this.validate();
        this.updatedAt = new Date();
    }

    private validate(): void {
        const limits = REMINDER_CONFIG_LIMITS;

        if (this.enabledChannels.length === 0) {
            throw new InvalidInputException('At least one reminder channel must be enabled.');
        }

        const unsupported = this.enabledChannels.filter((channel) => !limits.supportedChannels.includes(channel));

        if (unsupported.length > 0) {
            throw new InvalidInputException(`Reminder channel not supported: ${unsupported.join(', ')}.`);
        }

        if (this.hoursBeforeList.length === 0 || this.hoursBeforeList.length > limits.maxLeadTimes) {
            throw new InvalidInputException(`Reminders need between 1 and ${limits.maxLeadTimes} lead times.`);
        }

        const outOfRange = this.hoursBeforeList.some(
            (hours) => !Number.isInteger(hours) || hours < limits.minHoursBefore || hours > limits.maxHoursBefore
        );

        if (outOfRange) {
            throw new InvalidInputException(
                `Reminder lead times must be whole hours between ${limits.minHoursBefore} and ${limits.maxHoursBefore}.`
            );
        }

        if (this.messageTemplate !== null) {
            if (this.messageTemplate.length > limits.maxTemplateLength) {
                throw new InvalidInputException(
                    `Reminder text must be at most ${limits.maxTemplateLength} characters long.`
                );
            }

            const unknown = findUnknownReminderVariables(this.messageTemplate);

            if (unknown.length > 0) {
                throw new InvalidInputException(`Unknown reminder variables: ${unknown.join(', ')}.`);
            }
        }
    }

    toJSON(): EntityJson<ClinicReminderConfig> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            enabledChannels: this.enabledChannels,
            hoursBeforeList: this.hoursBeforeList,
            messageTemplate: this.messageTemplate,
            isActive: this.isActive,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

function uniqueChannels(channels: ReminderChannel[]): ReminderChannel[] {
    return [...new Set(channels)];
}

/** Unique, largest first (e.g. 48 h, then 24 h, then 2 h). */
function sortedLeadTimes(hours: number[]): number[] {
    return [...new Set(hours)].toSorted((a, b) => b - a);
}

function normalizeTemplate(template: string | null | undefined): string | null {
    const trimmed = template?.trim() ?? '';

    return trimmed.length === 0 ? null : trimmed;
}

export class ClinicReminderConfigId extends EntityId<'ClinicReminderConfigId'> {
    static from(value: string): ClinicReminderConfigId {
        return new ClinicReminderConfigId(value);
    }

    static generate(): ClinicReminderConfigId {
        return new ClinicReminderConfigId();
    }
}
