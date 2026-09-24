import {mock} from 'jest-mock-extended';
import {CreateClinicMemberService} from '@application/clinic-member/services/create-clinic-member.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException} from '@domain/@shared/exceptions';
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

    clinicRepository.findById.mockResolvedValue(clinic);
    memberRepository.findByClinicId.mockResolvedValue([]);
    const service = new CreateClinicMemberService(memberRepository, clinicRepository, dispatcher);

    return {actor, clinic, memberRepository, clinicRepository, dispatcher, service};
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
});
