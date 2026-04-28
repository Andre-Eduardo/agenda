/**
 * CLI script to ingest knowledge documents into the Knowledge-RAG store.
 *
 * Usage:
 *   pnpm -F @agenda-app/server ingest:knowledge <file> [<file2> ...] \
 *     [--category=protocolo] [--specialty=MEDICINA] [--company-id=<uuid>]
 *
 * Supported extensions: .md, .txt
 */

import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import {NestFactory} from '@nestjs/core';
import {AppModule} from '../src/app.module';
import {IngestKnowledgeDocumentService} from '../src/application/knowledge-base/services/ingest-knowledge-document.service';
import {ClinicId} from '../src/domain/clinic/entities';
import type {AiSpecialtyGroup} from '../src/domain/form-template/entities';

interface CliArgs {
    files: string[];
    category: string;
    specialty?: AiSpecialtyGroup;
    clinicId?: ClinicId;
}

function parseArgs(): CliArgs {
    const args = process.argv.slice(2);
    const files: string[] = [];
    let category = 'manual';
    let specialty: AiSpecialtyGroup | undefined;
    let clinicId: ClinicId | undefined;

    for (const arg of args) {
        if (arg.startsWith('--category=')) {
            category = arg.slice('--category='.length);
        } else if (arg.startsWith('--specialty=')) {
            specialty = arg.slice('--specialty='.length) as AiSpecialtyGroup;
        } else if (arg.startsWith('--clinic-id=')) {
            clinicId = ClinicId.from(arg.slice('--clinic-id='.length));
        } else if (!arg.startsWith('--')) {
            files.push(arg);
        }
    }

    if (files.length === 0) {
        console.error(
            'Usage: ingest:knowledge <file> [...files] [--category=<cat>] [--specialty=<spec>] [--clinic-id=<uuid>]',
        );
        process.exit(1);
    }

    return {files, category, specialty, clinicId};
}

function readFile(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
        console.warn(`[WARN] PDF not supported in MVP. Skipping: ${filePath}`);
        return '';
    }

    if (ext !== '.md' && ext !== '.txt') {
        console.warn(`[WARN] Unsupported extension "${ext}". Skipping: ${filePath}`);
        return '';
    }

    return fs.readFileSync(filePath, 'utf-8');
}

async function main() {
    const {files, category, specialty, clinicId} = parseArgs();

    const app = await NestFactory.createApplicationContext(AppModule, {logger: false});
    const ingestService = app.get(IngestKnowledgeDocumentService);

    const startTime = Date.now();
    let totalCreated = 0;
    let totalDeduped = 0;
    let totalFiles = 0;

    for (const filePath of files) {
        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            console.error(`[ERROR] File not found: ${absolutePath}`);
            continue;
        }

        const content = readFile(absolutePath);
        if (!content) continue;

        console.log(`Ingesting: ${absolutePath}`);

        const result = await ingestService.execute({
            content,
            category,
            specialty,
            clinicId,
            sourceFile: absolutePath,
            metadata: {
                title: path.basename(filePath, path.extname(filePath)),
                originalFormat: path.extname(filePath).slice(1),
            },
        });

        totalCreated += result.chunksCreated;
        totalDeduped += result.chunksDeduped;
        totalFiles++;

        console.log(`  ✓ ${result.chunksCreated} chunks created, ${result.chunksDeduped} deduped`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nDone: ${totalFiles} file(s), ${totalCreated} chunks created, ${totalDeduped} deduped in ${elapsed}s`);

    await app.close();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
