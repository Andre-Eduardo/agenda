import {AccessDeniedReason} from '@domain/@shared/exceptions';
import {Authorizer} from '@domain/auth/authorizer/authorizer';
import type {Permission} from '@domain/auth/permission';
import {modulesGranting} from '@domain/clinic-license/models';
import type {ModuleAccess} from '@domain/clinic-license/services';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {UserId} from '@domain/user/entities';

/**
 * Remove as permissões dos pacotes que a clínica não contratou ou que não foram
 * liberados para o membro. Sem membro (contexto global) nada é filtrado.
 */
export class ModuleAuthorizer extends Authorizer {
    constructor(
        private readonly moduleAccess: ModuleAccess,
        private readonly authorizer: Authorizer
    ) {
        super();
    }

    async getPermissions(clinicMemberId: ClinicMemberId | null, userId: UserId): Promise<Set<Permission>> {
        const permissions = await this.authorizer.getPermissions(clinicMemberId, userId);

        if (clinicMemberId === null) return permissions;

        const allowed = await this.moduleAccess.getAllowedPermissions(clinicMemberId);

        return new Set([...permissions].filter((permission) => allowed.has(permission)));
    }

    async denialReason(
        clinicMemberId: ClinicMemberId | null,
        userId: UserId,
        permissions: readonly Permission[]
    ): Promise<AccessDeniedReason> {
        if (clinicMemberId === null) return this.authorizer.denialReason(clinicMemberId, userId, permissions);

        const roleGranted = await this.authorizer.getPermissions(clinicMemberId, userId);
        const required = permissions.filter((permission) => roleGranted.has(permission)).flatMap(modulesGranting);

        if (required.length === 0) return this.authorizer.denialReason(clinicMemberId, userId, permissions);

        const clinicModules = await this.moduleAccess.getClinicModulesOfMember(clinicMemberId);

        return required.some((type) => clinicModules.has(type))
            ? AccessDeniedReason.MODULE_NOT_ASSIGNED
            : AccessDeniedReason.MODULE_NOT_ENABLED;
    }
}
