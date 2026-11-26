import {ReminderChannel} from '@domain/appointment-reminder/entities';
import type {PatientCommunicationPreferenceChange} from '@domain/patient-communication-preference/entities';

/** Current preference of one channel. `lastChange` is null when the patient never changed it. */
export type ChannelPreference = {
    channel: ReminderChannel;
    optedOut: boolean;
    lastChange: PatientCommunicationPreferenceChange | null;
};

/**
 * Folds a patient's change history into the current preference of every channel.
 * A channel without changes is allowed: reminders are part of the care the patient booked,
 * and refusing them is the patient's explicit choice (opt-out).
 */
export function currentPreferences(changes: PatientCommunicationPreferenceChange[]): ChannelPreference[] {
    return Object.values(ReminderChannel).map((channel) => {
        const lastChange = latest(changes.filter((change) => change.channel === channel));

        return {channel, optedOut: lastChange?.optedOut ?? false, lastChange};
    });
}

/** Channels the patient refused, from their change history. */
export function optedOutChannels(changes: PatientCommunicationPreferenceChange[]): Set<ReminderChannel> {
    return new Set(
        currentPreferences(changes)
            .filter((preference) => preference.optedOut)
            .map((preference) => preference.channel)
    );
}

function latest(changes: PatientCommunicationPreferenceChange[]): PatientCommunicationPreferenceChange | null {
    let result: PatientCommunicationPreferenceChange | null = null;

    for (const change of changes) {
        if (
            result === null ||
            change.occurredAt.getTime() > result.occurredAt.getTime() ||
            (change.occurredAt.getTime() === result.occurredAt.getTime() &&
                change.createdAt.getTime() >= result.createdAt.getTime())
        ) {
            result = change;
        }
    }

    return result;
}
