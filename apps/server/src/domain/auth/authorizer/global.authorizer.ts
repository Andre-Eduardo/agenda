import type {ProfessionalId} from '../../professional/entities';
import type {UserId} from '../../user/entities';
import type {UserRepository} from '../../user/user.repository';
import {GlobalRole} from '../global-role';
import {Permission, UserPermission} from '../permission';
import {Authorizer} from './authorizer';

export const permissionsMap: Record<GlobalRole, Set<Permission>> = {
    [GlobalRole.SUPER_ADMIN]: Permission.all(),
    [GlobalRole.OWNER]: Permission.all(),
    [GlobalRole.NONE]: new Set([UserPermission.VIEW_PROFILE, UserPermission.CHANGE_PASSWORD]),
};

export class GlobalAuthorizer extends Authorizer {
    constructor(private readonly userRepository: UserRepository) {
        super();
    }

    async getPermissions(_: ProfessionalId | null, userId: UserId): Promise<Set<Permission>> {
        const user = await this.userRepository.findById(userId);

        if (user === null) {
            return new Set();
        }

        return permissionsMap[user.globalRole];
    }
}
