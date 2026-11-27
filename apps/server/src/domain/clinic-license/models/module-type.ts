import {
    AgentPermission,
    AgentProposalPermission,
    AiFormPermission,
    ClinicalChatPermission,
    DraftEvolutionPermission,
    KnowledgeBasePermission,
    Permission,
} from '@domain/auth/permission';
import {allOperationalModules, type OperationalModuleType} from '@domain/clinic-license/models/operational-module';

export enum ModuleType {
    AI_CHAT = 'AI_CHAT',
    AI_AGENT = 'AI_AGENT',
    AI_FORMS = 'AI_FORMS',
    AI_DOCUMENT_IMPORT = 'AI_DOCUMENT_IMPORT',
}

export type ModuleDefinition = {
    readonly type: ModuleType;
    readonly permissions: ReadonlySet<Permission>;
};

/**
 * Pacotes vendidos à parte. Toda permissão que não está em nenhum pacote nem em um
 * módulo de clínica (`operational-module.ts`) é básica (sistema base, sempre disponível). Uma permissão pode estar em mais de um pacote.
 */
export const allModules: readonly ModuleDefinition[] = [
    {
        type: ModuleType.AI_CHAT,
        permissions: new Set<Permission>([
            ...Object.values(ClinicalChatPermission),
            ...Object.values(KnowledgeBasePermission),
        ]),
    },
    {
        type: ModuleType.AI_AGENT,
        permissions: new Set<Permission>([
            ...Object.values(AgentPermission),
            ...Object.values(AgentProposalPermission),
            ...Object.values(KnowledgeBasePermission),
        ]),
    },
    {
        type: ModuleType.AI_FORMS,
        permissions: new Set<Permission>(Object.values(AiFormPermission)),
    },
    {
        type: ModuleType.AI_DOCUMENT_IMPORT,
        permissions: new Set<Permission>(Object.values(DraftEvolutionPermission)),
    },
];

const modulePermissions: ReadonlySet<Permission> = new Set(
    [...allModules, ...allOperationalModules].flatMap((module) => [...module.permissions])
);

export const basicPermissions: ReadonlySet<Permission> = new Set(
    [...Permission.all()].filter((permission) => !modulePermissions.has(permission))
);

/** Permissões básicas mais as dos pacotes e dos módulos de clínica informados. */
export function permissionsFor(
    modules: Iterable<ModuleType>,
    operationalModules: Iterable<OperationalModuleType> = []
): Set<Permission> {
    const enabled = new Set<ModuleType | OperationalModuleType>([...modules, ...operationalModules]);
    const permissions = new Set(basicPermissions);

    for (const module of [...allModules, ...allOperationalModules]) {
        if (!enabled.has(module.type)) continue;

        for (const permission of module.permissions) permissions.add(permission);
    }

    return permissions;
}

/** Pacotes que concedem a permissão (vazio para permissão básica). */
export function modulesGranting(permission: Permission): ModuleType[] {
    return allModules.filter((module) => module.permissions.has(permission)).map((module) => module.type);
}
