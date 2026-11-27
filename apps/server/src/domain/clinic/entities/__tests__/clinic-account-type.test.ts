import {PreconditionException} from '@domain/@shared/exceptions';
import {ClinicAccountType} from '@domain/clinic/entities';
import {fakeClinic} from '@domain/clinic/entities/__tests__/fake-clinic';
import {ClinicAccountTypeChangedEvent} from '@domain/clinic/events';

describe('Clinic account type', () => {
    it('turns a solo account into a clinic and turns reception on', () => {
        const clinic = fakeClinic({accountType: ClinicAccountType.SOLO, receptionEnabled: false});

        clinic.changeAccountType(ClinicAccountType.CLINIC, 1);

        expect(clinic.accountType).toBe(ClinicAccountType.CLINIC);
        expect(clinic.receptionEnabled).toBe(true);
        expect(clinic.events).toContainEqual(
            expect.objectContaining({
                type: ClinicAccountTypeChangedEvent.type,
                from: ClinicAccountType.SOLO,
                to: ClinicAccountType.CLINIC,
            })
        );
    });

    it('goes back to solo only with a single member', () => {
        const clinic = fakeClinic({accountType: ClinicAccountType.CLINIC});

        expect(() => clinic.changeAccountType(ClinicAccountType.SOLO, 2)).toThrow(PreconditionException);
        expect(clinic.accountType).toBe(ClinicAccountType.CLINIC);

        clinic.changeAccountType(ClinicAccountType.SOLO, 1);

        expect(clinic.isSolo()).toBe(true);
        expect(clinic.receptionEnabled).toBe(true);
    });

    it('does nothing when the type does not change', () => {
        const clinic = fakeClinic({accountType: ClinicAccountType.CLINIC});

        clinic.changeAccountType(ClinicAccountType.CLINIC, 5);

        expect(clinic.events).toEqual([]);
    });
});
