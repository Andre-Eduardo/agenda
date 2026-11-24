import {AccessDeniedException, InvalidInputException, PreconditionException} from '@domain/@shared/exceptions';
import {ClinicLicense, ClinicLicenseId, SeatDecision} from '@domain/clinic-license/entities';
import {ModuleType} from '@domain/clinic-license/models';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';

const accept = {acceptExtraCharge: true};
const decline = {acceptExtraCharge: false};

function licenseWithChat(seats: {includedSeats: number; maxSeats: number | null}): ClinicLicense {
    const license = ClinicLicense.create({clinicId: ClinicId.generate()});

    license.enableModule(ModuleType.AI_CHAT, seats);

    return license;
}

describe('A clinic license', () => {
    it('starts as the base system: one professional and no module', () => {
        const license = ClinicLicense.create({clinicId: ClinicId.generate()});

        expect(license.includedProfessionals).toBe(1);
        expect(license.extraProfessionals).toBe(0);
        expect(license.maxProfessionals).toBe(1);
        expect(license.modules.size).toBe(0);
        expect(license.checkProfessionalSeat(0)).toBe(SeatDecision.INCLUDED);
        expect(license.checkProfessionalSeat(1)).toBe(SeatDecision.LIMIT_REACHED);
    });

    it('keeps an explicit unlimited professional ceiling', () => {
        const license = ClinicLicense.create({clinicId: ClinicId.generate(), maxProfessionals: null});

        expect(license.checkProfessionalSeat(50)).toBe(SeatDecision.EXTRA_CHARGE);
    });

    it('charges an extra professional only after the charge is accepted', () => {
        const license = ClinicLicense.create({clinicId: ClinicId.generate()});

        license.setProfessionalLimits({includedProfessionals: 2, maxProfessionals: 3});

        expect(license.reserveProfessionalSeat(1, decline)).toBe(SeatDecision.INCLUDED);
        expect(() => license.reserveProfessionalSeat(2, decline)).toThrow(PreconditionException);
        expect(license.reserveProfessionalSeat(2, accept)).toBe(SeatDecision.EXTRA_CHARGE);
        expect(license.extraProfessionals).toBe(1);
        expect(license.checkProfessionalSeat(2)).toBe(SeatDecision.INCLUDED);
        expect(() => license.reserveProfessionalSeat(3, accept)).toThrow(/clinic_license\.seat_limit_reached/);
    });

    it('rejects an invalid seat configuration', () => {
        const license = ClinicLicense.create({clinicId: ClinicId.generate()});

        expect(() => license.setProfessionalLimits({includedProfessionals: 3, maxProfessionals: 2})).toThrow(
            InvalidInputException
        );
        expect(() => license.enableModule(ModuleType.AI_CHAT, {includedSeats: -1, maxSeats: null})).toThrow(
            InvalidInputException
        );
    });

    it('only assigns members to contracted modules', () => {
        const license = ClinicLicense.create({clinicId: ClinicId.generate()});

        expect(() => license.assign(ModuleType.AI_AGENT, ClinicMemberId.generate(), accept)).toThrow(
            AccessDeniedException
        );
    });

    it('assigns members within the seats and charges the extra ones', () => {
        const license = licenseWithChat({includedSeats: 1, maxSeats: 2});
        const first = ClinicMemberId.generate();
        const second = ClinicMemberId.generate();

        expect(license.assign(ModuleType.AI_CHAT, first, decline)).toBe(SeatDecision.INCLUDED);
        expect(license.assign(ModuleType.AI_CHAT, first, decline)).toBe(SeatDecision.INCLUDED);
        expect(() => license.assign(ModuleType.AI_CHAT, second, decline)).toThrow(/clinic_license\.extra_seat_confirmation_required/);
        expect(license.assign(ModuleType.AI_CHAT, second, accept)).toBe(SeatDecision.EXTRA_CHARGE);
        expect(license.modules.get(ModuleType.AI_CHAT)?.extraSeats).toBe(1);
        expect(() => license.assign(ModuleType.AI_CHAT, ClinicMemberId.generate(), accept)).toThrow(
            /clinic_license\.seat_limit_reached/
        );
        expect(license.membersOf(ModuleType.AI_CHAT)).toEqual([first, second]);
    });

    it('keeps paid extra seats when a member leaves until the next cycle', () => {
        const license = licenseWithChat({includedSeats: 0, maxSeats: null});
        const member = ClinicMemberId.generate();

        license.assign(ModuleType.AI_CHAT, member, accept);
        license.unassign(ModuleType.AI_CHAT, member);
        license.unassign(ModuleType.AI_CHAT, member);

        expect(license.isAssigned(ModuleType.AI_CHAT, member)).toBe(false);
        expect(license.modules.get(ModuleType.AI_CHAT)?.extraSeats).toBe(1);
        expect(license.checkModuleSeat(ModuleType.AI_CHAT)).toBe(SeatDecision.INCLUDED);
    });

    it('lists only the contracted modules a member was assigned to', () => {
        const license = licenseWithChat({includedSeats: 2, maxSeats: 2});
        const member = ClinicMemberId.generate();

        license.enableModule(ModuleType.AI_FORMS, {includedSeats: 1, maxSeats: 1});
        license.assign(ModuleType.AI_CHAT, member, decline);
        license.assign(ModuleType.AI_FORMS, member, decline);
        license.assign(ModuleType.AI_CHAT, ClinicMemberId.generate(), decline);

        expect(license.modulesOf(member)).toEqual(new Set([ModuleType.AI_CHAT, ModuleType.AI_FORMS]));

        license.disableModule(ModuleType.AI_FORMS);
        license.disableModule(ModuleType.AI_FORMS);

        expect(license.modulesOf(member)).toEqual(new Set([ModuleType.AI_CHAT]));

        license.unassignMember(member);
        license.unassignMember(member);

        expect(license.modulesOf(member)).toEqual(new Set());
        expect(license.membersOf(ModuleType.AI_CHAT)).toHaveLength(1);
    });

    it('keeps the extra seats already paid when a module is re-enabled', () => {
        const license = licenseWithChat({includedSeats: 0, maxSeats: null});

        license.assign(ModuleType.AI_CHAT, ClinicMemberId.generate(), accept);
        license.enableModule(ModuleType.AI_CHAT, {includedSeats: 3, maxSeats: 5});

        expect(license.modules.get(ModuleType.AI_CHAT)).toEqual({includedSeats: 3, extraSeats: 1, maxSeats: 5});
    });

    it('serializes to JSON', () => {
        const license = licenseWithChat({includedSeats: 1, maxSeats: 1});
        const member = ClinicMemberId.generate();

        license.assign(ModuleType.AI_CHAT, member, decline);

        expect(license.toJSON()).toEqual({
            id: license.id.toJSON(),
            clinicId: license.clinicId.toJSON(),
            includedProfessionals: 1,
            extraProfessionals: 0,
            maxProfessionals: 1,
            modules: {[ModuleType.AI_CHAT]: {includedSeats: 1, extraSeats: 0, maxSeats: 1}},
            assignments: [
                {
                    moduleType: ModuleType.AI_CHAT,
                    clinicMemberId: member.toJSON(),
                    assignedAt: license.assignments[0].assignedAt.toJSON(),
                },
            ],
            createdAt: license.createdAt.toJSON(),
            updatedAt: license.updatedAt.toJSON(),
            deletedAt: null,
        });
    });

    it('builds identifiers from strings', () => {
        const id = ClinicLicenseId.generate();

        expect(ClinicLicenseId.from(id.toString()).equals(id)).toBe(true);
    });
});
