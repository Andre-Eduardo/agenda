import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Permission} from '@domain/auth/permission';
import {ClinicMemberRole} from '@domain/clinic-member/entities';
import {clinicMemberRolePermissionsMap} from '../clinic-member-role.authorizer';

describe('the versioned clinic RBAC matrix', () => {
    it('documents every domain permission and the exact decision for every clinic role', () => {
        const document = readFileSync(resolve(__dirname, '../../../../../../../docs/rbac-matrix.md'), 'utf8');
        expect(document).toMatch(/^# Matriz RBAC da clínica — v\d+\.\d+\.\d+/);

        const rows = document
            .split('\n')
            .filter((line) => line.startsWith('| ') && !line.startsWith('| Recurso') && !line.startsWith('| ---'));
        const documented = new Map<ClinicMemberRole, Set<string>>(
            Object.values(ClinicMemberRole).map((role) => [role, new Set<string>()])
        );
        const resources = new Set<string>();

        for (const row of rows) {
            const [resource, ...roleCells] = row
                .split('|')
                .slice(1, -1)
                .map((cell) => cell.trim());
            expect(resource).toBeTruthy();
            expect(resources.has(resource)).toBe(false);
            expect(roleCells).toHaveLength(Object.values(ClinicMemberRole).length);
            resources.add(resource);

            for (const [index, role] of Object.values(ClinicMemberRole).entries()) {
                const cell = roleCells[index];
                expect(cell).toBeTruthy();
                if (cell === '—') continue;

                for (const action of cell.split(', ')) {
                    const permission = Permission.of(`${resource}:${action}`);
                    expect(documented.get(role)?.has(permission)).toBe(false);
                    documented.get(role)?.add(permission);
                }
            }
        }

        expect(resources).toEqual(new Set([...Permission.all()].map((permission) => permission.split(':')[0])));
        for (const role of Object.values(ClinicMemberRole)) {
            expect(documented.get(role)).toEqual(new Set(clinicMemberRolePermissionsMap[role]));
        }
    });
});
