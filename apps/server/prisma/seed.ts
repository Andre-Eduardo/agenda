/**
 * Entrypoint principal dos seeds de desenvolvimento.
 *
 * Executa todos os seeds na ordem correta (respeitando dependências).
 *
 * Uso:
 *   ts-node prisma/seed.ts
 *   pnpm -F @agenda-app/server prisma:seed
 *
 * Ordem de execução:
 *   1. clinic                     — User + Clinic + ClinicMember (OWNER) + Person + Professional
 *   2. patients                   — Pacientes vinculados à clínica
 *   3. working-hours              — Horários de atendimento do membro
 *   4. appointments               — Consultas (passadas e futuras)
 *   5. form-templates             — Templates públicos de formulários clínicos
 *   6. ai-agent-profiles          — Perfis de agentes de IA clínicos
 *   7. clinical-document-templates — Templates padrão de documentos clínicos
 */
import {main as seedClinic} from './seeds/clinic.seed';
import {main as seedPatients} from './seeds/patients.seed';
import {main as seedWorkingHours} from './seeds/working-hours.seed';
import {main as seedAppointments} from './seeds/appointments.seed';
import {main as seedFormTemplates} from './seeds/form-templates.seed';
import {main as seedAiAgentProfiles} from './seeds/ai-agent-profiles.seed';
import {main as seedClinicalDocumentTemplates} from './seeds/clinical-document-templates.seed';

async function main() {
    console.log('=== Iniciando seeds de desenvolvimento ===\n');

    console.log('--- [1/7] Clínica + admin ---');
    await seedClinic();
    console.log('');

    console.log('--- [2/7] Pacientes ---');
    await seedPatients();
    console.log('');

    console.log('--- [3/7] Horários de atendimento ---');
    await seedWorkingHours();
    console.log('');

    console.log('--- [4/7] Consultas ---');
    await seedAppointments();
    console.log('');

    console.log('--- [5/7] Templates de formulários ---');
    await seedFormTemplates();
    console.log('');

    console.log('--- [6/7] Perfis de agentes de IA ---');
    await seedAiAgentProfiles();
    console.log('');

    console.log('--- [7/7] Templates de documentos clínicos ---');
    await seedClinicalDocumentTemplates();
    console.log('');

    console.log('=== Seeds concluídos com sucesso! ===');
    console.log('');
    console.log('Credenciais do admin:');
    console.log('  Email:    admin@agenda.dev');
    console.log('  Senha:    Admin@123456');
    console.log('  Username: admin');
}

main().catch((err) => {
    console.error('Erro ao executar seeds:', err);
    process.exit(1);
});
