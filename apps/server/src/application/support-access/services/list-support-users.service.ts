import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {SupportUserDto} from '@application/support-access/dtos';
import {GlobalRole} from '@domain/auth';
import {UserRepository} from '@domain/user/user.repository';

const SUPPORT_USERS_LIMIT = 200;

@Injectable()
export class ListSupportUsersService implements ApplicationService<undefined, SupportUserDto[]> {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(_: Command): Promise<SupportUserDto[]> {
        const result = await this.userRepository.search(
            {limit: SUPPORT_USERS_LIMIT, sort: [{key: 'createdAt', direction: 'asc'}]},
            {globalRoles: [GlobalRole.SUPPORT]}
        );

        return result.data.map((user) => new SupportUserDto(user));
    }
}
