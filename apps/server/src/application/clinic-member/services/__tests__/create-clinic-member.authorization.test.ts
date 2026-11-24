import {mock} from 'jest-mock-extended';
import {CreateClinicMemberService} from '@application/clinic-member/services/create-clinic-member.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, PreconditionException} from '@domain/@shared/exceptions';
import type {AtomicExecutor} from '@domain/@shared/repository';
import type {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ClinicLicense} from '@domain/clinic-license/entities';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {Clinic} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {UserId} from '@domain/user/entities';

function setup() {
    const creatorId = UserId.generate();
    const clinic = Clinic.create({name: 'Clinic', createdByUserId: creatorId});
    const actor: Actor = {
        userId: creatorId,
        clinicId: clinic.id,
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const memberRepository = mock<ClinicMemberRepository>();
    const clinicRepository = mock<ClinicRepository>();
    const dispatcher = mock<EventDispatcher>();
    const licenseRepository = mock<ClinicLicenseRepository>();
    const atomicExecutor = mock<AtomicExecutor>();

    atomicExecutor.runAtomically.mockImplementation((callback) => callback());
    clinicRepository.findById.mockResolvedValue(clinic);
    memberRepository.findByClinicId.mockResolvedValue([]);
    licenseRepository.findByClinicId.mockResolvedValue(null);
    const service = new CreateClinicMemberService(memberRepository, clinicRepository, licenseRepository, dispatcher);

    Object.assign(service, {atomicExecutor});

    return {actor, clinic, memberRepository, clinicRepository, licenseRepository, dispatcher, service};
}

function managerOf(clinic: Clinic, actor: Actor, others: ClinicMember[] = []) {
    const manager = ClinicMember.create({
        clinicId: clinic.id,
        userId: actor.userId,
        roles: [ClinicMemberRole.OWNER, ClinicMemberRole.PROFESSIONAL],
        isActive: true,
    });

    manager.id = actor.clinicMemberId;

    return {manager, members: [manager, ...others]};
}

describe('clinic member creation authorization', () => {
    it('allows only the clinic creator to claim the first membership for themselves', async () => {
        const {actor, clinic, memberRepository, service} = setup();
        const payload = {
            clinicId: clinic.id.toString(),
            userId: actor.userId.toString(),
            roles: [ClinicMemberRole.OWNER],
        };

        await expect(service.execute({actor, payload})).resolves.toMatchObject({clinicId: clinic.id.toString()});
        expect(memberRepository.save).toHaveBeenCalledTimes(1);
    });

    it('denies another user attempting to claim an unowned clinic', async () => {
        const {actor, clinic, memberRepository, service} = setup();

        actor.userId = UserId.generate();
        const payload = {
            clinicId: clinic.id.toString(),
            userId: actor.userId.toString(),
            roles: [ClinicMemberRole.OWNER],
        };

        await expect(service.execute({actor, payload})).rejects.toThrow(AccessDeniedException);
        expect(memberRepository.save).not.toHaveBeenCalled();
    });

    it('denies a non-manager from inviting another member', async () => {
        const {actor, clinic, memberRepository, service} = setup();
        const current = ClinicMember.create({
            clinicId: clinic.id,
            userId: actor.userId,
            roles: [ClinicMemberRole.PROFESSIONAL],
            isActive: true,
        });

        current.id = actor.clinicMemberId;
        memberRepository.findByClinicId.mockResolvedValue([current]);
        memberRepository.findById.mockResolvedValue(current);
        const payload = {
            clinicId: clinic.id.toString(),
            userId: UserId.generate().toString(),
            roles: [ClinicMemberRole.VIEWER],
        };

        await expect(service.execute({actor, payload})).rejects.toThrow(AccessDeniedException);
        expect(memberRepository.save).not.toHaveBeenCalled();
    });

    describe('professional seats', () => {
        function setupWithManager(license: ClinicLicense | null) {
            const context = setup();
            const {manager, members} = managerOf(context.clinic, context.actor);

            context.memberRepository.findByClinicId.mockResolvedValue(members);
            context.memberRepository.findById.mockResolvedValue(manager);
            context.licenseRepository.findByClinicId.mockResolvedValue(license);

            return context;
        }

        function professionalPayload(clinic: Clinic, acceptExtraCharge = false) {
            return {
                clinicId: clinic.id.toString(),
                userId: UserId.generate().toString(),
                roles: [ClinicMemberRole.PROFESSIONAL],
                acceptExtraCharge,
            };
        }

        it('does not count staff that does not attend patients', async () => {
            const {actor, clinic, memberRepository, licenseRepository, service} = setupWithManager(null);
            const payload = {
                clinicId: clinic.id.toString(),
                userId: UserId.generate().toString(),
                roles: [ClinicMemberRole.SECRETARY],
            };

            await service.execute({actor, payload});

            expect(licenseRepository.findByClinicId).not.toHaveBeenCalled();
            expect(memberRepository.save).toHaveBeenCalledTimes(1);
        });

        it('blocks a professional above the base system limit', async () => {
            const {actor, clinic, memberRepository, service} = setupWithManager(null);

            await expect(service.execute({actor, payload: professionalPayload(clinic, true)})).rejects.toThrow(
                /SEAT_LIMIT_REACHED/
            );
            expect(memberRepository.save).not.toHaveBeenCalled();
        });

        it('adds a professional within the plan without touching the license', async () => {
            const license = ClinicLicense.create({
                clinicId: setup().clinic.id,
                includedProfessionals: 2,
                maxProfessionals: 2,
            });
            const {actor, clinic, memberRepository, licenseRepository, service} = setupWithManager(license);

            license.clinicId = clinic.id;
            await service.execute({actor, payload: professionalPayload(clinic)});

            expect(memberRepository.save).toHaveBeenCalledTimes(1);
            expect(licenseRepository.save).not.toHaveBeenCalled();
        });

        it('asks for the extra charge and records it once accepted', async () => {
            const clinicId = setup().clinic.id;
            const license = ClinicLicense.create({clinicId, includedProfessionals: 1, maxProfessionals: 5});
            const {actor, clinic, memberRepository, licenseRepository, dispatcher, service} = setupWithManager(license);

            await expect(service.execute({actor, payload: professionalPayload(clinic)})).rejects.toThrow(
                PreconditionException
            );
            expect(memberRepository.save).not.toHaveBeenCalled();

            await service.execute({actor, payload: professionalPayload(clinic, true)});

            expect(license.extraProfessionals).toBe(1);
            expect(licenseRepository.save).toHaveBeenCalledWith(license);
            expect(dispatcher.dispatch).toHaveBeenCalledWith(expect.objectContaining({clinicId: clinic.id}), license);
            expect(memberRepository.save).toHaveBeenCalledTimes(1);
        });
    });
});
