import {AggregateRoot, type AllEntityProps, type EntityJson} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import {ReminderChannel} from '../../appointment-reminder/entities';

export type CreateClinicReminderConfig = {
    clinicId: ClinicId;
    enabledChannels: ReminderChannel[];
    hoursBeforeList: number[];
    isActive?: boolean;
};

export class ClinicReminderConfig extends AggregateRoot<ClinicReminderConfigId> {
    clinicId: ClinicId;
    enabledChannels: ReminderChannel[];
    hoursBeforeList: number[];
    isActive: boolean;

    constructor(props: AllEntityProps<ClinicReminderConfig>) {
        super(props);
        this.clinicId = props.clinicId;
        this.enabledChannels = props.enabledChannels;
        this.hoursBeforeList = props.hoursBeforeList;
        this.isActive = props.isActive;
    }

    static create(props: CreateClinicReminderConfig): ClinicReminderConfig {
        const id = ClinicReminderConfigId.generate();
        const now = new Date();

        return new ClinicReminderConfig({
            id,
            clinicId: props.clinicId,
            enabledChannels: props.enabledChannels,
            hoursBeforeList: props.hoursBeforeList,
            isActive: props.isActive ?? true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    configure(props: {
        enabledChannels?: ReminderChannel[];
        hoursBeforeList?: number[];
        isActive?: boolean;
    }): void {
        if (props.enabledChannels !== undefined) {
            this.enabledChannels = props.enabledChannels;
        }

        if (props.hoursBeforeList !== undefined) {
            this.hoursBeforeList = props.hoursBeforeList;
        }

        if (props.isActive !== undefined) {
            this.isActive = props.isActive;
        }

        this.updatedAt = new Date();
    }

    toJSON(): EntityJson<ClinicReminderConfig> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            enabledChannels: this.enabledChannels,
            hoursBeforeList: this.hoursBeforeList,
            isActive: this.isActive,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class ClinicReminderConfigId extends EntityId<'ClinicReminderConfigId'> {
    static from(value: string): ClinicReminderConfigId {
        return new ClinicReminderConfigId(value);
    }

    static generate(): ClinicReminderConfigId {
        return new ClinicReminderConfigId();
    }
}
