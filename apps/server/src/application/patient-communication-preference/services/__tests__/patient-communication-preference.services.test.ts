import {mock} from 'jest-mock-extended';
import type {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import type {Actor} from '@domain/@shared/actor';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ReminderChannel} from '@domain/appointment-reminder/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {
    CommunicationPreferenceSource,
    PatientCommunicationPreferenceChange,
} from '@domain/patient-communication-preference/entities';
import type {PatientCommunicationPreferenceRepository} from '@domain/patient-communication-preference/patient-communication-preference.repository';
import {type Patient, PatientId} from '@domain/patient/entities';
import type {PatientRepository} from '@domain/patient/patient.repository';
import {UserId} from '@domain/user/entities';
import {GetPatientCommunicationPreferencesService} from '../get-patient-communication-preferences.service';
import {UpdatePatientCommunicationPreferenceService} from '../update-patient-communication-preference.service';

describe('Patient communication preference services', () => {
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const patientId = PatientId.generate();
    const patientRepository = mock<PatientRepository>();
    const preferenceRepository = mock<PatientCommunicationPreferenceRepository>();
    const accessChecker = mock<PatientAccessChecker>();
    const getService = new GetPatientCommunicationPreferencesService(
        patientRepository,
        preferenceRepository,
        accessChecker
    );
    const updateService = new UpdatePatientCommunicationPreferenceService(
        patientRepository,
        preferenceRepository,
        accessChecker
    );

    beforeEach(() => {
        jest.resetAllMocks();
        jest.useFakeTimers({now: new Date('2026-11-26T12:00:00Z')});
        patientRepository.findById.mockResolvedValue(mock<Patient>());
        preferenceRepository.findHistory.mockResolvedValue([]);
        preferenceRepository.recordIfAbsent.mockResolvedValue(true);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should record a staff opt-out with who, when and why', async () => {
        await updateService.execute({
            actor,
            payload: {patientId, channel: ReminderChannel.WHATSAPP, optedOut: true, reason: 'Pediu por telefone'},
        });

        expect(accessChecker.assertCanAccess).toHaveBeenCalledWith(actor, patientId, 'register');

        const [[change]] = preferenceRepository.recordIfAbsent.mock.calls;

        expect(change).toBeInstanceOf(PatientCommunicationPreferenceChange);
        expect(change).toMatchObject({
            clinicId: actor.clinicId,
            patientId,
            channel: ReminderChannel.WHATSAPP,
            optedOut: true,
            source: CommunicationPreferenceSource.STAFF,
            changedByMemberId: actor.clinicMemberId,
            reason: 'Pediu por telefone',
            occurredAt: new Date('2026-11-26T12:00:00Z'),
        });
    });

    it('should return the current state of every channel with the history', async () => {
        const optOut = PatientCommunicationPreferenceChange.record({
            clinicId: actor.clinicId,
            patientId,
            channel: ReminderChannel.EMAIL,
            optedOut: true,
            source: CommunicationPreferenceSource.EMAIL_COMPLAINT,
            occurredAt: new Date('2026-11-20T08:00:00Z'),
        });

        preferenceRepository.findHistory.mockResolvedValue([optOut]);

        const result = await getService.execute({actor, payload: {patientId}});

        expect(accessChecker.assertCanAccess).toHaveBeenCalledWith(actor, patientId, 'basic');
        expect(result.channels).toEqual(
            expect.arrayContaining([
                {
                    channel: ReminderChannel.EMAIL,
                    optedOut: true,
                    changedAt: '2026-11-20T08:00:00.000Z',
                    source: CommunicationPreferenceSource.EMAIL_COMPLAINT,
                },
                {channel: ReminderChannel.WHATSAPP, optedOut: false, changedAt: null, source: null},
            ])
        );
        expect(result.history).toHaveLength(1);
    });

    it('should reject a patient of another clinic', async () => {
        patientRepository.findById.mockResolvedValue(null);

        await expect(
            updateService.execute({actor, payload: {patientId, channel: ReminderChannel.SMS, optedOut: true}})
        ).rejects.toThrow(ResourceNotFoundException);
        expect(preferenceRepository.recordIfAbsent).not.toHaveBeenCalled();
    });
});
