import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {chmod, mkdir, mkdtemp, readFile, readdir, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const script = fileURLToPath(new URL('agenda-backup.mjs', import.meta.url));

function run(command, env) {
    return spawnSync(process.execPath, [script, command], {env, encoding: 'utf8'});
}

test('backs up, verifies and restores encrypted data in an isolated destination', async (t) => {
    const root = await mkdtemp(path.join(tmpdir(), 'agenda-backup-test-'));

    t.after(async () => {
        await (await import('node:fs/promises')).rm(root, {recursive: true, force: true});
    });
    const backupDir = path.join(root, 'backups');
    const uploads = path.join(root, 'uploads');
    const restoreUploads = path.join(root, 'restore-uploads');

    await Promise.all([mkdir(backupDir), mkdir(uploads), mkdir(restoreUploads)]);
    await chmod(backupDir, 0o700);
    await writeFile(path.join(uploads, 'clinical-document.txt'), 'clinical-file-fixture');

    const keyFile = path.join(root, 'key');

    await writeFile(keyFile, `${randomBytes(32).toString('hex')}\n`);
    await chmod(keyFile, 0o600);

    const dumpBin = path.join(root, 'pg_dump');
    const restoreBin = path.join(root, 'pg_restore');

    await writeFile(dumpBin, '#!/bin/sh\nprintf mock-database-fixture\n');
    await writeFile(restoreBin, '#!/bin/sh\ncat > "$RESTORE_CAPTURE"\n');
    await Promise.all([chmod(dumpBin, 0o700), chmod(restoreBin, 0o700)]);

    const env = {
        ...process.env,
        BACKUP_DIR: backupDir,
        BACKUP_KEY_FILE: keyFile,
        DATABASE_URL: 'postgresql://postgres:fixture@localhost:5432/source',
        LOCAL_UPLOAD_DIR: uploads,
        PG_DUMP_BIN: dumpBin,
        PG_RESTORE_BIN: restoreBin,
        RESTORE_DATABASE_URL: 'postgresql://postgres:fixture@localhost:5432/restore_test',
        RESTORE_UPLOAD_DIR: restoreUploads,
        RESTORE_CAPTURE: path.join(root, 'restored-database'),
    };

    const backup = run('backup', env);

    assert.equal(backup.status, 0, backup.stderr);
    const [backupName] = await readdir(backupDir);
    const backupPath = path.join(backupDir, backupName);
    const encrypted = await readFile(path.join(backupPath, 'database.dump.enc'));

    assert.equal(encrypted.includes('mock-database-fixture'), false);
    assert.equal(run('check', env).status, 0);

    const unsafe = run('restore', {...env, BACKUP_PATH: backupPath, RESTORE_DATABASE_URL: env.DATABASE_URL});

    assert.notEqual(unsafe.status, 0);
    assert.match(unsafe.stderr, /separate restore_ database/);

    const restore = run('restore', {...env, BACKUP_PATH: backupPath});

    assert.equal(restore.status, 0, restore.stderr);
    assert.equal(await readFile(env.RESTORE_CAPTURE, 'utf8'), 'mock-database-fixture');
    assert.equal(await readFile(path.join(restoreUploads, 'clinical-document.txt'), 'utf8'), 'clinical-file-fixture');

    await writeFile(path.join(backupPath, 'database.dump.enc'), Buffer.from('tamper'), {flag: 'a'});
    const invalid = run('check', env);

    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /integrity check/);

    await symlink(keyFile, path.join(uploads, 'unexpected-link'));
    const unsafeUpload = run('backup', env);

    assert.notEqual(unsafeUpload.status, 0);
    assert.match(unsafeUpload.stderr, /non-regular entry/);
});
