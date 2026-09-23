#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createCipheriv, createDecipheriv, createHash, randomBytes} from 'node:crypto';
import {createReadStream, createWriteStream} from 'node:fs';
import {access, lstat, mkdir, open, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const MAGIC = Buffer.from('ASB1');
const IV_BYTES = 12;
const TAG_BYTES = 16;
const BACKUP_PREFIX = 'agenda-';

process.umask(0o077);

function required(name) {
    const value = process.env[name];

    if (!value) throw new Error(`${name} is required`);

    return value;
}

function positiveNumber(name, fallback) {
    const value = Number(process.env[name] ?? fallback);

    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);

    return value;
}

function backupRoot() {
    const value = required('BACKUP_DIR');

    if (!path.isAbsolute(value)) throw new Error('BACKUP_DIR must be absolute');

    return path.resolve(value);
}

async function encryptionKey() {
    const keyFile = required('BACKUP_KEY_FILE');
    const file = await lstat(keyFile);

    // The lowest six POSIX mode bits are group/other permissions.
    if (!file.isFile() || file.mode % 0o100 !== 0) {
        throw new Error('BACKUP_KEY_FILE must be a regular file readable only by its owner');
    }

    const hex = (await readFile(keyFile, 'utf8')).trim();

    if (!/^[a-fA-F0-9]{64}$/.test(hex)) throw new Error('BACKUP_KEY_FILE must contain a 32-byte hex key');

    return Buffer.from(hex, 'hex');
}

function pgEnvironment(urlString) {
    const url = new URL(urlString);

    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
        throw new Error('Database URL must use postgresql://');
    }

    const database = decodeURIComponent(url.pathname.slice(1));

    if (!database) throw new Error('Database name is required');

    if (!url.username) throw new Error('Database user is required');

    return {
        env: {
            ...process.env,
            PGHOST: url.hostname,
            PGPORT: url.port || '5432',
            PGUSER: decodeURIComponent(url.username),
            PGDATABASE: database,
            PGPASSWORD: decodeURIComponent(url.password),
            ...(url.searchParams.has('sslmode') ? {PGSSLMODE: url.searchParams.get('sslmode')} : {}),
        },
        database,
    };
}

function spawnInput(command, args, env) {
    const child = spawn(command, args, {env, stdio: ['ignore', 'pipe', 'pipe']});
    let stderr = '';

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
        stderr = (stderr + chunk).slice(-2000);
    });
    const completed = new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (code) =>
            code === 0 ? resolve() : reject(new Error(`${path.basename(command)} failed (${code}): ${stderr.trim()}`))
        );
    });

    return {stream: child.stdout, completed};
}

async function decryptToCommand(source, key, command, args, env) {
    const child = spawn(command, args, {env, stdio: ['pipe', 'ignore', 'pipe']});
    let stderr = '';

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
        stderr = (stderr + chunk).slice(-2000);
    });
    const completed = new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (code) =>
            code === 0 ? resolve() : reject(new Error(`${path.basename(command)} failed (${code}): ${stderr.trim()}`))
        );
    });

    await Promise.all([decryptStream(source, child.stdin, key), completed]);
}

async function encryptStream(stream, destination, key) {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const output = createWriteStream(destination, {flags: 'wx', mode: 0o600});

    output.write(Buffer.concat([MAGIC, iv]));
    await pipeline(stream, cipher, output, {end: false});
    await new Promise((resolve, reject) => {
        output.once('error', reject);
        output.end(cipher.getAuthTag(), resolve);
    });
}

async function decryptStream(source, destination, key) {
    const file = await open(source, 'r');
    let size;
    const header = Buffer.alloc(MAGIC.length + IV_BYTES);
    const tag = Buffer.alloc(TAG_BYTES);

    try {
        size = (await file.stat()).size;

        if (size <= header.length + TAG_BYTES) throw new Error('Encrypted archive is truncated');
        await file.read(header, 0, header.length, 0);
        await file.read(tag, 0, TAG_BYTES, size - TAG_BYTES);
    } finally {
        await file.close();
    }

    if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Unknown backup format');
    const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(MAGIC.length));

    decipher.setAuthTag(tag);
    await pipeline(createReadStream(source, {start: header.length, end: size - TAG_BYTES - 1}), decipher, destination);
}

async function sha256(filename) {
    const hash = createHash('sha256');

    await pipeline(createReadStream(filename), hash);

    return hash.digest('hex');
}

async function archive(destination, key, command, args, env) {
    const child = spawnInput(command, args, env);

    try {
        await Promise.all([encryptStream(child.stream, destination, key), child.completed]);
    } catch (error) {
        await rm(destination, {force: true});
        throw error;
    }

    return {file: path.basename(destination), sha256: await sha256(destination), bytes: (await stat(destination)).size};
}

async function manifestAt(directory) {
    const parsed = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));

    if (parsed.version !== 1 || !/^agenda-[0-9a-fTZ-]+$/.test(parsed.id)) throw new Error('Invalid backup manifest');

    return parsed;
}

async function backups(root) {
    const entries = await readdir(root, {withFileTypes: true});
    const result = [];

    for (const entry of entries) {
        if (!entry.isDirectory() || !entry.name.startsWith(BACKUP_PREFIX)) continue;
        const directory = path.join(root, entry.name);

        try {
            const manifest = await manifestAt(directory);

            if (manifest.id === entry.name) result.push({directory, manifest});
        } catch {
            // Incomplete backups are kept for investigation and never selected as healthy.
        }
    }

    return result.toSorted((a, b) => b.manifest.createdAt.localeCompare(a.manifest.createdAt));
}

async function verifyFiles(directory, manifest, key) {
    for (const component of [manifest.database, manifest.uploads].filter(Boolean)) {
        if (!/^[a-z]+\.[a-z]+\.enc$/.test(component.file)) throw new Error('Invalid component path');
        const filename = path.join(directory, component.file);

        if ((await stat(filename)).size !== component.bytes || (await sha256(filename)) !== component.sha256) {
            throw new Error(`${component.file} failed integrity check`);
        }

        await decryptStream(
            filename,
            new Writable({
                write(_chunk, _encoding, done) {
                    done();
                },
            }),
            key
        );
    }
}

async function assertRegularTree(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
        const filename = path.join(directory, entry.name);

        if (entry.isDirectory()) await assertRegularTree(filename);
        else if (!entry.isFile()) throw new Error(`LOCAL_UPLOAD_DIR contains a non-regular entry: ${filename}`);
    }
}

async function runBackup() {
    const root = backupRoot();

    await access(root);
    const rootInfo = await lstat(root);

    if (!rootInfo.isDirectory() || rootInfo.mode % 0o100 !== 0) {
        throw new Error('BACKUP_DIR must be a directory accessible only to its owner');
    }

    const key = await encryptionKey();
    const {env} = pgEnvironment(required('DATABASE_URL'));

    if (process.env.STORAGE_TYPE?.toLowerCase() === 's3') {
        throw new Error('S3 object backup must be configured separately before using this workflow');
    }

    const uploadDir = process.env.LOCAL_UPLOAD_DIR;

    if (!uploadDir) throw new Error('LOCAL_UPLOAD_DIR is required to include local clinical files');

    if (uploadDir) {
        const resolvedUploads = path.resolve(uploadDir);

        if (root === resolvedUploads || root.startsWith(`${resolvedUploads}${path.sep}`)) {
            throw new Error('BACKUP_DIR cannot be inside LOCAL_UPLOAD_DIR');
        }

        const keyFile = path.resolve(required('BACKUP_KEY_FILE'));

        if (keyFile === resolvedUploads || keyFile.startsWith(`${resolvedUploads}${path.sep}`)) {
            throw new Error('BACKUP_KEY_FILE cannot be inside LOCAL_UPLOAD_DIR');
        }

        if (!(await lstat(resolvedUploads)).isDirectory())
            throw new Error('LOCAL_UPLOAD_DIR is not a regular directory');
        await assertRegularTree(resolvedUploads);
    }

    const id = `${BACKUP_PREFIX}${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}-${randomBytes(4).toString('hex')}`;
    const directory = path.join(root, id);

    await mkdir(directory, {mode: 0o700});

    try {
        const database = await archive(
            path.join(directory, 'database.dump.enc'),
            key,
            process.env.PG_DUMP_BIN ?? 'pg_dump',
            ['-Fc', '--no-owner', '--no-privileges'],
            env
        );
        const uploads = await archive(
            path.join(directory, 'uploads.tar.enc'),
            key,
            'tar',
            ['-C', path.resolve(uploadDir), '-cf', '-', '.'],
            process.env
        );
        const manifest = {version: 1, id, createdAt: new Date().toISOString(), database, uploads};

        await verifyFiles(directory, manifest, key);
        await writeFile(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, {
            flag: 'wx',
            mode: 0o600,
        });

    } catch (error) {
        await rm(directory, {recursive: true, force: true});
        throw error;
    }

    // Keep the new verified copy even if retention cleanup fails.
    if (process.env.BACKUP_RETENTION_DAYS) {
        const retention = positiveNumber('BACKUP_RETENTION_DAYS');
        const existing = await backups(root);

        for (const preserved of existing.slice(0, 2)) {
            await verifyFiles(preserved.directory, preserved.manifest, key);
        }

        for (const older of existing.slice(2)) {
            if (Date.parse(older.manifest.createdAt) < Date.now() - retention * 86400000) {
                await rm(older.directory, {recursive: true});
            }
        }
    }

    console.log(`Backup verified: ${directory}`);
}

async function runCheck() {
    const root = backupRoot();
    const key = await encryptionKey();
    const latest = (await backups(root))[0];

    if (!latest) throw new Error('No complete backup found');
    const age = Date.now() - Date.parse(latest.manifest.createdAt);

    if (!Number.isFinite(age) || age > positiveNumber('BACKUP_MAX_AGE_HOURS', 26) * 3600000) {
        throw new Error('Latest backup is stale');
    }

    await verifyFiles(latest.directory, latest.manifest, key);
    console.log(`Backup healthy: ${latest.directory}`);
}

async function runRestore() {
    const directory = path.resolve(required('BACKUP_PATH'));
    const key = await encryptionKey();
    const manifest = await manifestAt(directory);

    if (manifest.id !== path.basename(directory)) throw new Error('Manifest does not match backup directory');
    const restoreUrl = required('RESTORE_DATABASE_URL');
    const {database, env} = pgEnvironment(restoreUrl);

    if (!database.startsWith('restore_') || restoreUrl === process.env.DATABASE_URL) {
        throw new Error('Restore destination must be a separate restore_ database');
    }

    await verifyFiles(directory, manifest, key);
    let uploadDestination;

    if (manifest.uploads) {
        uploadDestination = required('RESTORE_UPLOAD_DIR');

        if (!path.isAbsolute(uploadDestination) || !path.basename(uploadDestination).startsWith('restore-')) {
            throw new Error('RESTORE_UPLOAD_DIR must be an absolute restore-* directory');
        }

        if ((await readdir(uploadDestination)).length > 0) throw new Error('RESTORE_UPLOAD_DIR must be empty');
    }

    await decryptToCommand(
        path.join(directory, manifest.database.file),
        key,
        process.env.PG_RESTORE_BIN ?? 'pg_restore',
        ['--exit-on-error', '--single-transaction', '--no-owner', '--no-privileges', '--dbname', database],
        env
    );

    if (manifest.uploads) {
        await decryptToCommand(
            path.join(directory, manifest.uploads.file),
            key,
            'tar',
            ['-xf', '-', '-C', uploadDestination],
            process.env
        );
    }

    console.log(`Restore completed in isolated database ${database}`);
}

const command = process.argv[2];

try {
    if (command === 'backup') await runBackup();
    else if (command === 'check') await runCheck();
    else if (command === 'restore') await runRestore();
    else throw new Error('Usage: agenda-backup.mjs backup|check|restore');
} catch (error) {
    console.error(`Backup ${command ?? 'command'} failed: ${error.message}`);

    if (process.env.BACKUP_ALERT_URL) {
        try {
            const response = await fetch(process.env.BACKUP_ALERT_URL, {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({
                    service: 'agenda-saude-backup',
                    command,
                    status: 'failed',
                    at: new Date().toISOString(),
                }),
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) throw new Error('Backup alert endpoint rejected delivery', {cause: error});
        } catch {
            console.error('Backup alert delivery failed');
        }
    }

    process.exitCode = 1;
}
