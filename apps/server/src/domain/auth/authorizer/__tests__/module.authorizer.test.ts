import {mock} from 'jest-mock-extended';
import {AccessDeniedReason} from '@domain/@shared/exceptions';
import type {Authorizer} from '@domain/auth/authorizer';
import {ModuleAuthorizer} from '@domain/auth/authorizer';
import {
    AgentPermission,
    ClinicalChatPermission,
    PatientCallPermission,
    Permission,
    ProfessionalAgendaAccessPermission,
    RecordPermission,
} from '@domain/auth/permission';
import {ModuleType, OperationalModuleType, permissionsFor} from '@domain/clinic-license/models';
import type {ModuleAccess} from '@domain/clinic-license/services';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {UserId} from '@domain/user/entities';

function setup({
    memberModules = [] as ModuleType[],
    clinicModules = [] as ModuleType[],
    operationalModules = [OperationalModuleType.TEAM, OperationalModuleType.RECEPTION],
} = {}) {
    const inner = mock<Authorizer>();
    const moduleAccess = mock<ModuleAccess>();

    inner.getPermissions.mockResolvedValue(Permission.all());
    inner.denialReason.mockResolvedValue(AccessDeniedReason.INSUFFICIENT_PERMISSIONS);
    moduleAccess.getAllowedPermissions.mockResolvedValue(permissionsFor(memberModules, operationalModules));
    moduleAccess.getOperationalModulesOfMember.mockResolvedValue(new Set(operationalModules));
    moduleAccess.getClinicModulesOfMember.mockResolvedValue(new Set(clinicModules));

    return {inner, authorizer: new ModuleAuthorizer(moduleAccess, inner)};
}

const memberId = ClinicMemberId.generate();
const userId = UserId.generate();

describe('A module authorizer', () => {
    it('keeps every permission outside a clinic context', async () => {
        const {authorizer} = setup();

        await expect(authorizer.getPermissions(null, userId)).resolves.toEqual(Permission.all());
    });

    it('drops the permissions of modules the member does not have', async () => {
        const {authorizer} = setup({memberModules: [ModuleType.AI_CHAT]});
        const permissions = await authorizer.getPermissions(memberId, userId);

        expect(permissions.has(RecordPermission.VIEW)).toBe(true);
        expect(permissions.has(ClinicalChatPermission.CREATE)).toBe(true);
        expect(permissions.has(AgentPermission.ASK)).toBe(false);
    });

    it('explains a denial caused by a module the clinic did not contract', async () => {
        const {authorizer} = setup();

        await expect(authorizer.denialReason(memberId, userId, [AgentPermission.ASK])).resolves.toBe(
            AccessDeniedReason.MODULE_NOT_ENABLED
        );
    });

    it('explains a denial caused by a member not assigned to the module', async () => {
        const {authorizer} = setup({clinicModules: [ModuleType.AI_AGENT]});

        await expect(authorizer.denialReason(memberId, userId, [AgentPermission.ASK])).resolves.toBe(
            AccessDeniedReason.MODULE_NOT_ASSIGNED
        );
    });

    it('drops the clinic module permissions a solo account does not have', async () => {
        const {authorizer} = setup({operationalModules: [OperationalModuleType.RECEPTION]});
        const permissions = await authorizer.getPermissions(memberId, userId);

        expect(permissions.has(PatientCallPermission.OPERATE)).toBe(true);
        expect(permissions.has(ProfessionalAgendaAccessPermission.GRANT)).toBe(false);
    });

    it('explains a denial caused by a clinic module the account does not have', async () => {
        const {authorizer} = setup({operationalModules: []});

        await expect(
            authorizer.denialReason(memberId, userId, [ProfessionalAgendaAccessPermission.GRANT])
        ).resolves.toBe(AccessDeniedReason.MODULE_NOT_ENABLED);
    });

    it('falls back to the role decision otherwise', async () => {
        const {authorizer, inner} = setup();

        inner.getPermissions.mockResolvedValue(new Set());

        await expect(authorizer.denialReason(memberId, userId, [AgentPermission.ASK])).resolves.toBe(
            AccessDeniedReason.INSUFFICIENT_PERMISSIONS
        );
        await expect(authorizer.denialReason(null, userId, [AgentPermission.ASK])).resolves.toBe(
            AccessDeniedReason.INSUFFICIENT_PERMISSIONS
        );
    });
});
