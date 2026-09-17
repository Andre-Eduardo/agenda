import {execSync} from 'child_process';
import prompts from 'prompts';

const response = await prompts({
    type: 'text',
    name: 'migrationName',
    message: 'What is the name of the migration?',
});

if (!response.migrationName) {
    console.log('No migration name provided, exiting...');
    process.exit(1);
}

// Run the prisma command to create the migration
execSync(`npx prisma migrate dev --create-only --name ${response.migrationName.replaceAll(' ', '_')}`, {
    stdio: 'inherit',
});

console.log(
    '\n⚠️  Before applying: open the generated migration.sql and check for "DROP INDEX" on ' +
        '"knowledge_chunk_embedding_hnsw_idx" or "patient_context_chunk_embedding_hnsw_idx". ' +
        'Prisma v6 cannot represent HNSW indexes in schema.prisma, so migrate dev will always ' +
        'propose dropping them — remove those lines before running `prisma migrate dev` again ' +
        'or applying the migration, or you will silently break RAG vector search.\n'
);
