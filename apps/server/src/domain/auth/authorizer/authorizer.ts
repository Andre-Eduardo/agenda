import type {ProfessionalId} from '@domain/professional/entities';
import type {UserId} from '../../user/entities';
import type {Permission} from '../permission';

export abstract class Authorizer {
    async validate(professionalId: ProfessionalId | null, userId: UserId, permission: Permission): Promise<boolean> {
        const permissions = await this.getPermissions(professionalId, userId);

        return permissions.has(permission);
    }

    abstract getPermissions(professionalId: ProfessionalId | null, userId: UserId): Promise<Set<Permission>>;
}
