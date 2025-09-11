import type {CompanyId} from '../../company/entities';
import type {UserId} from '../../user/entities';
import type {Permission} from '../permission';

export abstract class Authorizer {
    async validate(companyId: CompanyId | null, userId: UserId, permission: Permission): Promise<boolean> {
        const permissions = await this.getPermissions(companyId, userId);

        return permissions.has(permission);
    }

    abstract getPermissions(companyId: CompanyId | null, userId: UserId): Promise<Set<Permission>>;
}
