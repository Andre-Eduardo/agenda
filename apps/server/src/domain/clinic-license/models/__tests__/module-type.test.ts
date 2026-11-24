import {
    AgentPermission,
    AgentProposalPermission,
    AiFormPermission,
    ClinicalChatPermission,
    ClinicModulePermission,
    DraftEvolutionPermission,
    KnowledgeBasePermission,
    RecordPermission,
} from '@domain/auth/permission';
import {ModuleType, allModules, basicPermissions, modulesGranting, permissionsFor} from '@domain/clinic-license/models';

const aiPermissions = [
    ...Object.values(ClinicalChatPermission),
    ...Object.values(AgentPermission),
    ...Object.values(AgentProposalPermission),
    ...Object.values(KnowledgeBasePermission),
    ...Object.values(AiFormPermission),
    ...Object.values(DraftEvolutionPermission),
];

describe('The module catalog', () => {
    it('defines every module type once', () => {
        expect(allModules.map((module) => module.type)).toEqual(Object.values(ModuleType));
    });

    it.each(aiPermissions)('sells %s in a module, never in the base system', (permission) => {
        expect(modulesGranting(permission).length).toBeGreaterThan(0);
        expect(basicPermissions.has(permission)).toBe(false);
    });

    it('keeps the core features and module management in the base system', () => {
        expect(basicPermissions.has(RecordPermission.CREATE)).toBe(true);
        expect(basicPermissions.has(ClinicModulePermission.ASSIGN)).toBe(true);
        expect(modulesGranting(RecordPermission.CREATE)).toEqual([]);
    });

    it('shares the knowledge base between chat and agent', () => {
        expect(modulesGranting(KnowledgeBasePermission.SEARCH)).toEqual([ModuleType.AI_CHAT, ModuleType.AI_AGENT]);
    });

    it('grants base permissions plus the ones of the enabled modules', () => {
        const permissions = permissionsFor([ModuleType.AI_FORMS]);

        expect(permissions.has(RecordPermission.VIEW)).toBe(true);
        expect(permissions.has(AiFormPermission.VIEW_CONTEXT)).toBe(true);
        expect(permissions.has(ClinicalChatPermission.CREATE)).toBe(false);
    });
});
