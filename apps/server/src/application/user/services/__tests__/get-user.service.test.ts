import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import type {UserRepository} from '../../../../domain/user/user.repository';
import type {GetUserDto} from '../../dtos';
import {UserDto} from '../../dtos';
import {GetUserService} from '../index';

describe('A get-user service', () => {
    const userRepository = mock<UserRepository>();
    const getUserService = new GetUserService(userRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a user', async () => {
        const existingUser = fakeUser();

        const payload: GetUserDto = {
            id: existingUser.id,
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);

        await expect(getUserService.execute({actor, payload})).resolves.toEqual(new UserDto(existingUser));

        expect(existingUser.events).toHaveLength(0);

        expect(userRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the user does not exist', async () => {
        const payload: GetUserDto = {
            id: UserId.generate(),
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getUserService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'User not found.'
        );
    });
});
