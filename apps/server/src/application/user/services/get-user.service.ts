import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetUserDto, UserDto} from '../dtos';

@Injectable()
export class GetUserService implements ApplicationService<GetUserDto, UserDto> {
    constructor(private readonly userRepository: UserRepository) {}

    async execute({payload}: Command<GetUserDto>): Promise<UserDto> {
        const user = await this.userRepository.findById(payload.id);

        if (user === null) {
            throw new ResourceNotFoundException('User not found.', payload.id.toString());
        }

        return new UserDto(user);
    }
}
