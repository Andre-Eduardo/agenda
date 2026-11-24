import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join, resolve} from 'node:path';
import * as PermissionModule from '@domain/auth/permission';
import {modulesGranting} from '@domain/clinic-license/models';

/**
 * Guard rail for the module boundary (see docs/ai-modules.md): any controller that calls IA
 * (lives in one of the AI feature folders, or injects AiProviderRegistry) must gate its
 * endpoints with a permission that belongs to an AI module — never a core permission — so a
 * forgotten `@Authorize` elsewhere can't leave an IA endpoint reachable without a module.
 */
const APPLICATION_DIR = resolve(__dirname, '../../../../application');
const AI_SCOPED_DIRS = ['agent', 'agent-proposal', 'clinical-chat', 'knowledge-base'];

function listTsFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
        if (entry === '__tests__') return [];

        const path = join(dir, entry);

        if (statSync(path).isDirectory()) return listTsFiles(path);

        return path.endsWith('.ts') ? [path] : [];
    });
}

function collectAiFiles(): Set<string> {
    const files = new Set<string>();

    for (const dir of AI_SCOPED_DIRS) {
        for (const file of listTsFiles(join(APPLICATION_DIR, dir))) files.add(file);
    }

    for (const file of listTsFiles(APPLICATION_DIR)) {
        if (readFileSync(file, 'utf8').includes('AiProviderRegistry')) files.add(file);
    }

    return files;
}

function permissionsAuthorizedBy(file: string): string[] {
    const content = readFileSync(file, 'utf8');

    return [...content.matchAll(/@Authorize\(([^)]*)\)/g)].flatMap((match) =>
        match[1]
            .split(',')
            .map((token) => token.trim())
            .filter(Boolean)
    );
}

function resolvePermission(file: string, token: string): PermissionModule.Permission {
    const [enumName, memberName] = token.split('.');
    const enumObject = (PermissionModule as Record<string, Record<string, string> | undefined>)[enumName];
    const value = enumObject?.[memberName];

    if (!value) throw new Error(`${file}: could not resolve permission expression "${token}"`);

    return PermissionModule.Permission.of(value);
}

describe('the AI module permission boundary', () => {
    it('only uses module-granting permissions in controllers that call AI', () => {
        const files = collectAiFiles();

        expect(files.size).toBeGreaterThan(0);

        for (const file of files) {
            for (const token of permissionsAuthorizedBy(file)) {
                const permission = resolvePermission(file, token);

                expect(modulesGranting(permission).length).toBeGreaterThan(0);
            }
        }
    });
});
