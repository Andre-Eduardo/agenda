import {
    ClinicPatientAccessPermission,
    PatientCallPermission,
    ProfessionalAgendaAccessPermission,
    RecordPermission,
} from '@domain/auth/permission';
import {
    OperationalModuleType,
    allOperationalModules,
    basicPermissions,
    operationalModulesGranting,
    operationalModulesOf,
    permissionsFor,
} from '@domain/clinic-license/models';
import {ClinicAccountType} from '@domain/clinic/entities';

describe('The clinic module catalog', () => {
    it('defines every clinic module once', () => {
        expect(allOperationalModules.map((module) => module.type)).toEqual(Object.values(OperationalModuleType));
    });

    it.each([
        [ProfessionalAgendaAccessPermission.GRANT, OperationalModuleType.TEAM],
        [ClinicPatientAccessPermission.MANAGE, OperationalModuleType.TEAM],
        [PatientCallPermission.OPERATE, OperationalModuleType.RECEPTION],
    ])('keeps %s out of the base system, in %s', (permission, module) => {
        expect(basicPermissions.has(permission)).toBe(false);
        expect(operationalModulesGranting(permission)).toEqual([module]);
    });

    it('keeps the core features in the base system', () => {
        expect(operationalModulesGranting(RecordPermission.CREATE)).toEqual([]);
        expect(permissionsFor([], []).has(RecordPermission.CREATE)).toBe(true);
    });

    it('grants the permissions of the enabled clinic modules', () => {
        const permissions = permissionsFor([], [OperationalModuleType.RECEPTION]);

        expect(permissions.has(PatientCallPermission.OPERATE)).toBe(true);
        expect(permissions.has(ProfessionalAgendaAccessPermission.GRANT)).toBe(false);
    });

    it.each([
        [ClinicAccountType.CLINIC, true, [OperationalModuleType.TEAM, OperationalModuleType.RECEPTION]],
        [ClinicAccountType.CLINIC, false, [OperationalModuleType.TEAM]],
        [ClinicAccountType.SOLO, true, [OperationalModuleType.RECEPTION]],
        [ClinicAccountType.SOLO, false, []],
    ])('turns on the right modules for a %s account (reception %s)', (accountType, receptionEnabled, expected) => {
        expect([...operationalModulesOf({accountType, receptionEnabled})]).toEqual(expected);
    });
});
