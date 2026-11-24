import {AccessDeniedReason} from '@domain/@shared/exceptions';
import type {Permission} from '@domain/auth/permission';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {UserId} from '@domain/user/entities';

export abstract class Authorizer {
    async validate(clinicMemberId: ClinicMemberId | null, userId: UserId, permission: Permission): Promise<boolean> {
        const permissions = await this.getPermissions(clinicMemberId, userId);

        return permissions.has(permission);
    }

    /** Por que nenhuma das permissões foi concedida. */
    async denialReason(
        _clinicMemberId: ClinicMemberId | null,
        _userId: UserId,
        _permissions: readonly Permission[]
    ): Promise<AccessDeniedReason> {
        return AccessDeniedReason.INSUFFICIENT_PERMISSIONS;
    }

    abstract getPermissions(clinicMemberId: ClinicMemberId | null, userId: UserId): Promise<Set<Permission>>;
}
