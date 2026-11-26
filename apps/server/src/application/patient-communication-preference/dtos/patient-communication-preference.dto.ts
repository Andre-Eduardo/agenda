import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {ReminderChannel} from '@domain/appointment-reminder/entities';
import type {ChannelPreference} from '@domain/patient-communication-preference/communication-preferences';
import {
    CommunicationPreferenceSource,
    type PatientCommunicationPreferenceChange,
} from '@domain/patient-communication-preference/entities';

@ApiSchema({name: 'PatientCommunicationPreferenceChange'})
export class PatientCommunicationPreferenceChangeDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty({enum: ReminderChannel, enumName: 'ReminderChannel'})
    channel: ReminderChannel;

    @ApiProperty({description: 'Whether the patient refused this channel from this change on'})
    optedOut: boolean;

    @ApiProperty({enum: CommunicationPreferenceSource, enumName: 'CommunicationPreferenceSource'})
    source: CommunicationPreferenceSource;

    @ApiProperty({type: 'string', format: 'uuid', nullable: true, description: 'Clinic member who recorded it'})
    changedByMemberId: string | null;

    @ApiProperty({
        type: 'string',
        nullable: true,
        description: 'Reason given by the clinic, or the text of the patient reply',
    })
    reason: string | null;

    @ApiProperty({format: 'date-time'})
    occurredAt: string;

    constructor(change: PatientCommunicationPreferenceChange) {
        this.id = change.id.toString();
        this.channel = change.channel;
        this.optedOut = change.optedOut;
        this.source = change.source;
        this.changedByMemberId = change.changedByMemberId?.toString() ?? null;
        this.reason = change.reason;
        this.occurredAt = change.occurredAt.toISOString();
    }
}

@ApiSchema({name: 'PatientChannelPreference'})
export class PatientChannelPreferenceDto {
    @ApiProperty({enum: ReminderChannel, enumName: 'ReminderChannel'})
    channel: ReminderChannel;

    @ApiProperty({description: 'Whether the patient refused this channel (opt-out)'})
    optedOut: boolean;

    @ApiProperty({type: 'string', format: 'date-time', nullable: true, description: 'Last change, if any'})
    changedAt: string | null;

    @ApiProperty({enum: CommunicationPreferenceSource, enumName: 'CommunicationPreferenceSource', nullable: true})
    source: CommunicationPreferenceSource | null;

    constructor(preference: ChannelPreference) {
        this.channel = preference.channel;
        this.optedOut = preference.optedOut;
        this.changedAt = preference.lastChange?.occurredAt.toISOString() ?? null;
        this.source = preference.lastChange?.source ?? null;
    }
}

@ApiSchema({name: 'PatientCommunicationPreferences'})
export class PatientCommunicationPreferencesDto {
    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({type: [PatientChannelPreferenceDto], description: 'Current preference of every channel'})
    channels: PatientChannelPreferenceDto[];

    @ApiProperty({type: [PatientCommunicationPreferenceChangeDto], description: 'Change history, newest first'})
    history: PatientCommunicationPreferenceChangeDto[];

    constructor(patientId: string, preferences: ChannelPreference[], history: PatientCommunicationPreferenceChange[]) {
        this.patientId = patientId;
        this.channels = preferences.map((preference) => new PatientChannelPreferenceDto(preference));
        this.history = history.map((change) => new PatientCommunicationPreferenceChangeDto(change));
    }
}
