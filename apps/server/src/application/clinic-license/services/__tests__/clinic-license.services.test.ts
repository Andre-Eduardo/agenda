import {mock} from 'jest-mock-extended';
import {
    ConfigureClinicLicenseService,
    GetClinicLicenseService,
    GetMyModulesService,
    SetModuleMembersService,
} from '@application/clinic-license/services';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, InvalidInputException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import type {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ClinicLicense} from '@domain/clinic-license/entities';
import {ModuleType, OperationalModuleType} from '@domain/clinic-license/models';
import type {ModuleAccess} from '@domain/clinic-license/services';
import type {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import type {ClinicRepository} from '@domain/clinic/clinic.repository';
import {Clinic, ClinicAccountType, ClinicId} from '@domain/clinic/entities';
import {fakeClinic} from '@domain/clinic/entities/__tests__/fake-clinic';
import type {EventDispatcher} from '@domain/event';
import {UserId} from '@domain/user/entities';

function member(clinicId: ClinicId, roles: ClinicMemberRole[], isActive = true): ClinicMember {
    return ClinicMember.create({clinicId, userId: UserId.generate(), roles, isActive});
}

// oxlint-disable-next-line typescript/no-redundant-type-constituents -- false positive: test files sit outside tsconfig, so the type-aware linter cannot resolve ClinicLicense
function setup(license: ClinicLicense | null = null) {
    const clinic = Clinic.create({name: 'Clinic', createdByUserId: UserId.generate()});
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: clinic.id,
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const professional = member(clinic.id, [ClinicMemberRole.PROFESSIONAL]);
    const colleague = member(clinic.id, [ClinicMemberRole.OWNER, ClinicMemberRole.PROFESSIONAL]);
    const secretary = member(clinic.id, [ClinicMemberRole.SECRETARY]);
    const licenseRepository = mock<ClinicLicenseRepository>();
    const memberRepository = mock<ClinicMemberRepository>();
    const clinicRepository = mock<ClinicRepository>();
    const dispatcher = mock<EventDispatcher>();

    licenseRepository.findByClinicId.mockResolvedValue(license);
    memberRepository.findByClinicId.mockResolvedValue([professional, colleague, secretary]);
    clinicRepository.findById.mockResolvedValue(clinic);

    return {
        clinic,
        actor,
        professional,
        colleague,
        secretary,
        licenseRepository,
        memberRepository,
        clinicRepository,
        dispatcher,
    };
}

function chatLicense(clinicId: ClinicId, includedSeats: number, maxSeats: number | null): ClinicLicense {
    const license = ClinicLicense.create({clinicId});

    license.enableModule(ModuleType.AI_CHAT, {includedSeats, maxSeats});

    return license;
}

describe('Clinic license services', () => {
    it('shows the base system to a clinic without license', async () => {
        const {clinic, actor, licenseRepository, memberRepository} = setup();
        const result = await new GetClinicLicenseService(licenseRepository, memberRepository).execute({
            actor,
            payload: {clinicId: clinic.id},
        });

        expect(result).toEqual({
            clinicId: clinic.id.toString(),
            professionals: {included: 1, extra: 0, max: 1, active: 2},
            modules: [],
        });
    });

    it('lets the platform admin configure plan limits and modules', async () => {
        const {clinic, actor, licenseRepository, memberRepository, clinicRepository, dispatcher} = setup();
        const service = new ConfigureClinicLicenseService(
            clinicRepository,
            licenseRepository,
            memberRepository,
            dispatcher
        );

        const result = await service.execute({
            actor,
            payload: {
                clinicId: clinic.id,
                includedProfessionals: 3,
                maxProfessionals: null,
                modules: [{type: ModuleType.AI_CHAT, includedSeats: 2, maxSeats: 5}],
            },
        });

        expect(result.professionals).toEqual({included: 3, extra: 0, max: null, active: 2});
        expect(result.modules).toEqual([
            {type: ModuleType.AI_CHAT, includedSeats: 2, extraSeats: 0, maxSeats: 5, memberIds: []},
        ]);
        expect(licenseRepository.save).toHaveBeenCalledTimes(1);
        expect(dispatcher.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({clinicId: clinic.id}),
            expect.any(ClinicLicense)
        );
    });

    it('refuses to configure an unknown clinic', async () => {
        const {actor, licenseRepository, memberRepository, clinicRepository, dispatcher} = setup();
        const service = new ConfigureClinicLicenseService(
            clinicRepository,
            licenseRepository,
            memberRepository,
            dispatcher
        );

        clinicRepository.findById.mockResolvedValue(null);

        await expect(
            service.execute({
                actor,
                payload: {clinicId: ClinicId.generate(), includedProfessionals: 1, maxProfessionals: 1, modules: []},
            })
        ).rejects.toThrow(ResourceNotFoundException);
    });

    describe('assigning members to a module', () => {
        it('replaces the member list of the module', async () => {
            const {clinic, actor, professional, colleague, licenseRepository, memberRepository, dispatcher} = setup();
            const license = chatLicense(clinic.id, 2, 2);

            license.assign(ModuleType.AI_CHAT, colleague.id, {acceptExtraCharge: false});
            licenseRepository.findByClinicId.mockResolvedValue(license);

            const result = await new SetModuleMembersService(licenseRepository, memberRepository, dispatcher).execute({
                actor,
                payload: {
                    moduleType: ModuleType.AI_CHAT,
                    clinicMemberIds: [professional.id.toString(), professional.id.toString()],
                    acceptExtraCharge: false,
                },
            });

            expect(result.modules[0].memberIds).toEqual([professional.id.toString()]);
            expect(licenseRepository.save).toHaveBeenCalledWith(license);
            expect(dispatcher.dispatch).toHaveBeenCalledWith(actor, license);
        });

        it('only assigns active professionals of the clinic', async () => {
            const {clinic, actor, secretary, licenseRepository, memberRepository, dispatcher} = setup();
            const service = new SetModuleMembersService(licenseRepository, memberRepository, dispatcher);

            licenseRepository.findByClinicId.mockResolvedValue(chatLicense(clinic.id, 5, 5));

            for (const id of [secretary.id, ClinicMemberId.generate()]) {
                await expect(
                    service.execute({
                        actor,
                        payload: {
                            moduleType: ModuleType.AI_CHAT,
                            clinicMemberIds: [id.toString()],
                            acceptExtraCharge: false,
                        },
                    })
                ).rejects.toThrow(InvalidInputException);
            }

            expect(licenseRepository.save).not.toHaveBeenCalled();
        });

        it('asks for the extra charge above the contracted seats', async () => {
            const {clinic, actor, professional, colleague, licenseRepository, memberRepository, dispatcher} = setup();
            const service = new SetModuleMembersService(licenseRepository, memberRepository, dispatcher);
            const payload = {
                moduleType: ModuleType.AI_CHAT,
                clinicMemberIds: [professional.id.toString(), colleague.id.toString()],
            };

            licenseRepository.findByClinicId.mockResolvedValue(chatLicense(clinic.id, 1, null));

            await expect(service.execute({actor, payload: {...payload, acceptExtraCharge: false}})).rejects.toThrow(
                /clinic_license\.extra_seat_confirmation_required/
            );

            const result = await service.execute({actor, payload: {...payload, acceptExtraCharge: true}});

            expect(result.modules[0].extraSeats).toBe(1);
        });

        it('refuses a module the clinic did not contract', async () => {
            const {actor, professional, licenseRepository, memberRepository, dispatcher} = setup();

            await expect(
                new SetModuleMembersService(licenseRepository, memberRepository, dispatcher).execute({
                    actor,
                    payload: {
                        moduleType: ModuleType.AI_AGENT,
                        clinicMemberIds: [professional.id.toString()],
                        acceptExtraCharge: true,
                    },
                })
            ).rejects.toThrow(AccessDeniedException);
        });
    });

    it('lists the modules of the current member', async () => {
        const {actor} = setup();
        const moduleAccess = mock<ModuleAccess>();

        const clinicRepository = mock<ClinicRepository>();

        moduleAccess.getMemberModules.mockResolvedValue(new Set([ModuleType.AI_FORMS]));
        moduleAccess.getOperationalModulesOfMember.mockResolvedValue(new Set([OperationalModuleType.RECEPTION]));
        clinicRepository.findById.mockResolvedValue(fakeClinic({accountType: ClinicAccountType.SOLO}));

        await expect(
            new GetMyModulesService(moduleAccess, clinicRepository).execute({actor, payload: undefined})
        ).resolves.toEqual({
            modules: [ModuleType.AI_FORMS],
            operationalModules: [OperationalModuleType.RECEPTION],
            accountType: ClinicAccountType.SOLO,
        });
        expect(moduleAccess.getMemberModules).toHaveBeenCalledWith(actor.clinicMemberId);
    });
});
