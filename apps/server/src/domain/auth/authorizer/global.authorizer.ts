import {Authorizer} from '@domain/auth/authorizer/authorizer';
import {GlobalRole} from '@domain/auth/global-role';
import {Permission, UserPermission} from '@domain/auth/permission';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {UserId} from '@domain/user/entities';
import type {UserRepository} from '@domain/user/user.repository';

/**
 * GlobalRole.OWNER only means "this user self-registered" (see User.signUp) —
 * every self-signed-up user gets it, regardless of which clinics they later
 * join or with what role. It exists to bootstrap a brand-new user before they
 * have any ClinicMember at all (create their own clinic, professional, etc. —
 * see the various @BypassClinicMember() endpoints), which is why it is only
 * elevated to Permission.all() below when there is NO active clinicMemberId
 * context (see getPermissions). Once the user is acting under a specific
 * clinic membership, their authority there comes exclusively from
 * ClinicMemberRoleAuthorizer / clinicMemberRolePermissionsMap — otherwise a
 * low-privilege member (e.g. SECRETARY) would inherit blanket permissions in
 * every clinic they belong to just for having self-registered once.
 */
const BASE_PERMISSIONS: Record<GlobalRole, Set<Permission>> = {
    [GlobalRole.SUPER_ADMIN]: Permission.all(),
    [GlobalRole.OWNER]: new Set([UserPermission.VIEW_PROFILE, UserPermission.CHANGE_PASSWORD]),
    [GlobalRole.NONE]: new Set([UserPermission.VIEW_PROFILE, UserPermission.CHANGE_PASSWORD]),
};

export class GlobalAuthorizer extends Authorizer {
    constructor(private readonly userRepository: UserRepository) {
        super();
    }

    async getPermissions(clinicMemberId: ClinicMemberId | null, userId: UserId): Promise<Set<Permission>> {
        const user = await this.userRepository.findById(userId);

        if (user === null) {
            return new Set();
        }

        if (user.globalRole === GlobalRole.SUPER_ADMIN) {
            return Permission.all();
        }

        // OWNER only bootstraps permissions before the actor has any clinic
        // membership context; inside a clinic, ClinicMemberRoleAuthorizer rules.
        if (user.globalRole === GlobalRole.OWNER && clinicMemberId === null) {
            return Permission.all();
        }

        return BASE_PERMISSIONS[user.globalRole];
    }
}
