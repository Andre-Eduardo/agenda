import {mock} from 'jest-mock-extended';
import {CLINIC_CREATION_NOT_ALLOWED, CreateClinicService} from '@application/clinic/services/create-clinic.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException} from '@domain/@shared/exceptions';
import {GlobalRole} from '@domain/auth';
import type {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicId} from '@domain/clinic/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import type {EventDispatcher} from '@domain/event';
import {fakeUser} from '@domain/user/entities/__tests__/fake-user';
import type {UserRepository} from '@domain/user/user.repository';

describe('CreateClinicService authorization', () => {
    const clinicRepository = mock<ClinicRepository>();
    const userRepository = mock<UserRepository>();
    const service = new CreateClinicService(clinicRepository, mock<EventDispatcher>(), userRepository);

    const user = fakeUser();
    const actor: Actor = {
        userId: user.id,
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };

    it.each([
        ['a team-member account (GlobalRole.NONE)', fakeUser({globalRole: GlobalRole.NONE})],
        ['an unknown user', null],
    ])('refuses %s', async (_, found) => {
        userRepository.findById.mockResolvedValueOnce(found);

        await expect(service.execute({actor, payload: {name: 'Nova'}})).rejects.toThrowWithMessage(
            AccessDeniedException,
            CLINIC_CREATION_NOT_ALLOWED
        );
        expect(clinicRepository.save).not.toHaveBeenCalled();
    });

    it.each([GlobalRole.OWNER, GlobalRole.SUPER_ADMIN])('lets a %s user create a clinic', async (globalRole) => {
        userRepository.findById.mockResolvedValueOnce(fakeUser({globalRole}));

        await expect(service.execute({actor, payload: {name: 'Nova'}})).resolves.toMatchObject({name: 'Nova'});
        expect(clinicRepository.save).toHaveBeenCalled();
    });
});
