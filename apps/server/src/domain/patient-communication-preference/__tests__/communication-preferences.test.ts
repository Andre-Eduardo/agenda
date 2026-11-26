import {ReminderChannel} from '@domain/appointment-reminder/entities';
import {ClinicId} from '@domain/clinic/entities';
import {currentPreferences, optedOutChannels} from '@domain/patient-communication-preference/communication-preferences';
import {
    CommunicationPreferenceSource,
    PatientCommunicationPreferenceChange,
} from '@domain/patient-communication-preference/entities';
import {isOptOutReply} from '@domain/patient-communication-preference/opt-out-keywords';
import {PatientId} from '@domain/patient/entities';

describe('Patient communication preferences', () => {
    const clinicId = ClinicId.generate();
    const patientId = PatientId.generate();

    function change(channel: ReminderChannel, optedOut: boolean, at: string): PatientCommunicationPreferenceChange {
        return PatientCommunicationPreferenceChange.record({
            clinicId,
            patientId,
            channel,
            optedOut,
            source: CommunicationPreferenceSource.STAFF,
            occurredAt: new Date(at),
        });
    }

    it('should allow every channel when the patient never changed anything', () => {
        expect(currentPreferences([])).toEqual(
            Object.values(ReminderChannel).map((channel) => ({channel, optedOut: false, lastChange: null}))
        );
        expect(optedOutChannels([]).size).toBe(0);
    });

    it('should take the latest change of each channel, whatever the order of the history', () => {
        const optOut = change(ReminderChannel.WHATSAPP, true, '2026-11-01T10:00:00Z');
        const optIn = change(ReminderChannel.WHATSAPP, false, '2026-11-10T10:00:00Z');
        const emailOut = change(ReminderChannel.EMAIL, true, '2026-11-05T10:00:00Z');

        const preferences = currentPreferences([optOut, emailOut, optIn]);

        expect(preferences.find((p) => p.channel === ReminderChannel.WHATSAPP)).toEqual({
            channel: ReminderChannel.WHATSAPP,
            optedOut: false,
            lastChange: optIn,
        });
        expect([...optedOutChannels([optIn, emailOut, optOut])]).toEqual([ReminderChannel.EMAIL]);
    });

    it('should keep the reason trimmed and drop an empty one', () => {
        const blank = PatientCommunicationPreferenceChange.record({
            clinicId,
            patientId,
            channel: ReminderChannel.SMS,
            optedOut: true,
            source: CommunicationPreferenceSource.STAFF,
            occurredAt: new Date(),
            reason: '   ',
        });

        expect(blank.reason).toBeNull();
    });

    it.each(['SAIR', 'sair.', ' Parar ', 'STOP', 'Não quero receber', 'descadastrar!'])(
        'should read "%s" as an opt-out reply',
        (text) => {
            expect(isOptOutReply(text)).toBe(true);
        }
    );

    it.each([null, 'Confirmo', 'Cancelar', 'vou sair mais cedo do trabalho', 'Sair? Não, confirmo'])(
        'should not read "%s" as an opt-out reply',
        (text) => {
            expect(isOptOutReply(text)).toBe(false);
        }
    );
});
