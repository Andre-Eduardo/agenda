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
 *   5. clinical-data              — Perfis clínicos e alertas dos pacientes
 *   6. records                    — Evoluções clínicas (SOAP)
 *   7. form-templates             — Templates públicos de formulários clínicos
 *   8. ai-agent-profiles          — Perfis de agentes de IA clínicos
 *   9. clinical-document-templates — Templates padrão de documentos clínicos
 *  10. subscriptions              — Assinaturas de profissionais
 */
import {main as seedClinic} from './seeds/clinic.seed';
import {main as seedPatients} from './seeds/patients.seed';
import {main as seedWorkingHours} from './seeds/working-hours.seed';
import {main as seedAppointments} from './seeds/appointments.seed';
import {main as seedClinicalData} from './seeds/clinical-data.seed';
import {main as seedRecords} from './seeds/records.seed';
import {main as seedFormTemplates} from './seeds/form-templates.seed';
import {main as seedAiAgentProfiles} from './seeds/ai-agent-profiles.seed';
import {main as seedClinicalDocumentTemplates} from './seeds/clinical-document-templates.seed';
import {main as seedSubscriptions} from './seeds/subscriptions.seed';

async function main() {
    console.log('=== Iniciando seeds de desenvolvimento ===\n');

    console.log('--- [1/10] Clínica + admin ---');
    await seedClinic();
    console.log('');

    console.log('--- [2/10] Pacientes ---');
    await seedPatients();
    console.log('');

    console.log('--- [3/10] Horários de atendimento ---');
    await seedWorkingHours();
    console.log('');

    console.log('--- [4/10] Consultas ---');
    await seedAppointments();
    console.log('');

    console.log('--- [5/10] Perfis clínicos e alertas ---');
    await seedClinicalData();
    console.log('');

    console.log('--- [6/10] Evoluções clínicas ---');
    await seedRecords();
    console.log('');

    console.log('--- [7/10] Templates de formulários ---');
    await seedFormTemplates();
    console.log('');

    console.log('--- [8/10] Perfis de agentes de IA ---');
    await seedAiAgentProfiles();
    console.log('');

    console.log('--- [9/10] Templates de documentos clínicos ---');
    await seedClinicalDocumentTemplates();
    console.log('');

    console.log('--- [10/10] Assinaturas de profissionais ---');
    await seedSubscriptions();
    console.log('');

    console.log('=== Seeds concluídos com sucesso! ===');
    console.log('');
    console.log('Credenciais do admin:');
    console.log('  Email:    admin@agenda.dev');
    console.log('  Senha:    Admin@123456');
    console.log('  Username: admin');
}

main().catch((error) => {
    console.error('Erro ao executar seeds:', error);
    process.exit(1);
});
