#!/usr/bin/env node
// Long-running scheduler for agenda-backup.mjs, used by the production `backup` container.
//
// - Runs `backup` once a day at BACKUP_SCHEDULE_UTC (HH:MM, default 05:00 UTC = 02:00 BRT).
// - Runs `check` after every backup and every BACKUP_CHECK_INTERVAL_MINUTES (default 60).
// - Runs a first backup at startup unless BACKUP_RUN_ON_START=false.
// - Jobs never overlap; failures are reported by agenda-backup.mjs itself (exit code + BACKUP_ALERT_URL).
// - Writes BACKUP_HEALTH_FILE (default /tmp/backup-healthy) while the latest `check` passes,
//   so the container healthcheck reflects the state of the backups.

import {spawn} from 'node:child_process';
import {chmod, mkdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const BACKUP_SCRIPT = fileURLToPath(new URL('agenda-backup.mjs', import.meta.url));

export function parseSchedule(value = '05:00') {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());

    if (!match) throw new Error('BACKUP_SCHEDULE_UTC must use the HH:MM format');

    const hour = Number(match[1]);
    const minute = Number(match[2]);

    if (hour > 23 || minute > 59) throw new Error('BACKUP_SCHEDULE_UTC must be a valid UTC time');

    return {hour, minute};
}

export function nextDailyRun(now, {hour, minute}) {
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute));

    if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);

    return next;
}

export function positiveMinutes(value, fallback) {
    const minutes = Number(value ?? fallback);

    if (!Number.isSafeInteger(minutes) || minutes <= 0) {
        throw new Error('BACKUP_CHECK_INTERVAL_MINUTES must be a positive integer');
    }

    return minutes;
}

function log(message) {
    console.log(`[backup-scheduler] ${new Date().toISOString()} ${message}`);
}

function runCommand(command) {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, [BACKUP_SCRIPT, command], {env: process.env, stdio: 'inherit'});

        child.on('error', (error) => {
            log(`${command} could not start: ${error.message}`);
            resolve(1);
        });
        child.on('close', (code) => resolve(code ?? 1));
    });
}

async function main() {
    const schedule = parseSchedule(process.env.BACKUP_SCHEDULE_UTC);
    const checkMinutes = positiveMinutes(process.env.BACKUP_CHECK_INTERVAL_MINUTES, 60);
    const healthFile = process.env.BACKUP_HEALTH_FILE ?? '/tmp/backup-healthy';
    const backupDir = process.env.BACKUP_DIR;

    if (!backupDir || !path.isAbsolute(backupDir)) throw new Error('BACKUP_DIR must be an absolute path');

    // agenda-backup.mjs requires the destination to exist and be accessible only by its owner.
    await mkdir(backupDir, {recursive: true, mode: 0o700});
    await chmod(backupDir, 0o700);

    let queue = Promise.resolve();
    let stopping = false;
    const timers = new Set();

    const enqueue = (command) => {
        queue = queue.then(async () => {
            if (stopping) return;
            log(`running ${command}`);
            const code = await runCommand(command);

            log(`${command} finished with exit code ${code}`);

            if (command === 'check') {
                if (code === 0) await writeFile(healthFile, `${new Date().toISOString()}\n`);
                else await rm(healthFile, {force: true});
            }
        });

        return queue;
    };

    const backupThenCheck = () => {
        enqueue('backup');
        enqueue('check');
    };

    const scheduleBackup = () => {
        const next = nextDailyRun(new Date(), schedule);

        log(`next backup at ${next.toISOString()}`);
        const timer = setTimeout(() => {
            timers.delete(timer);
            backupThenCheck();
            scheduleBackup();
        }, next.getTime() - Date.now());

        timers.add(timer);
    };

    const checkTimer = setInterval(() => enqueue('check'), checkMinutes * 60_000);

    timers.add(checkTimer);

    const stop = (signal) => {
        if (stopping) return;
        stopping = true;
        log(`${signal} received, waiting for the current job to finish`);

        for (const timer of timers) clearTimeout(timer);
        queue.finally(() => process.exit(0));
    };

    process.on('SIGTERM', () => stop('SIGTERM'));
    process.on('SIGINT', () => stop('SIGINT'));

    if (process.env.BACKUP_RUN_ON_START === 'false') enqueue('check');
    else backupThenCheck();

    scheduleBackup();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(`[backup-scheduler] ${error.message}`);
        process.exit(1);
    });
}
