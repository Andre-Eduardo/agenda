import {Authorizer} from '@domain/auth/authorizer/authorizer';
import {GlobalRole} from '@domain/auth/global-role';
import {Permission, SupportAccessPermission, UserPermission} from '@domain/auth/permission';
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
const SELF_PERMISSIONS: readonly Permission[] = [UserPermission.VIEW_PROFILE, UserPermission.CHANGE_PASSWORD];

/** Ações que só leem. Toda permissão de escrita tem outra ação (create, update, manage...). */
const READ_ACTIONS: ReadonlySet<string> = new Set(['view', 'list', 'view-clinic', 'view-member', 'view-metrics']);

/**
 * Recursos com dado clínico ou pessoal sensível (LGPD), que o suporte nunca lê: prontuário,
 * evoluções, perfil clínico, documentos, formulários, alertas e o que a IA monta em cima deles.
 * `user:view` também fica de fora: o suporte não consulta contas de outras pessoas.
 */
const SUPPORT_HIDDEN_RESOURCES: ReadonlySet<string> = new Set([
    'user',
    'record',
    'clinical-profile',
    'clinical-chat',
    'clinical-document',
    'imported-document',
    'patient-form',
    'patient-alert',
    'draft-evolution',
    'ai-form',
    'knowledge-base',
    'agent',
    'agent-proposal',
]);

/**
 * GlobalRole.SUPPORT: entra em qualquer clínica (SupportAccessPermission.ENTER) para avaliar
 * configuração, só lendo e sem dados clínicos. Como o vínculo de suporte não tem papel de
 * clínica, estas são todas as permissões dele lá dentro.
 */
export const SUPPORT_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
    ...SELF_PERMISSIONS,
    SupportAccessPermission.ENTER,
    ...[...Permission.clinicScoped()].filter((permission) => {
        const [resource, action] = permission.split(':');

        return READ_ACTIONS.has(action) && !SUPPORT_HIDDEN_RESOURCES.has(resource);
    }),
]);

const BASE_PERMISSIONS: Record<GlobalRole, ReadonlySet<Permission>> = {
    [GlobalRole.SUPER_ADMIN]: Permission.all(),
    [GlobalRole.SUPPORT]: SUPPORT_PERMISSIONS,
    [GlobalRole.OWNER]: new Set(SELF_PERMISSIONS),
    [GlobalRole.NONE]: new Set(SELF_PERMISSIONS),
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
            return Permission.clinicScoped();
        }

        return new Set(BASE_PERMISSIONS[user.globalRole]);
    }
}
