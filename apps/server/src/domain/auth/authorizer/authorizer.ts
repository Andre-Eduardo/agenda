import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {UserId} from '../../user/entities';
import type {Permission} from '../permission';

export abstract class Authorizer {
    async validate(
        clinicMemberId: ClinicMemberId | null,
        userId: UserId,
        permission: Permission,
    ): Promise<boolean> {
        const permissions = await this.getPermissions(clinicMemberId, userId);

        return permissions.has(permission);
    }

    abstract getPermissions(
        clinicMemberId: ClinicMemberId | null,
        userId: UserId,
    ): Promise<Set<Permission>>;
}
