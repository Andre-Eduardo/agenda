import {main as seedAiAgentProfiles} from './seeds/ai-agent-profiles.seed';
import {main as seedAppointments} from './seeds/appointments.seed';
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
 *   2. team                       — Outros profissionais + membro com perfil diferente + agenda access
 *   3. patients                   — Pacientes vinculados à clínica
 *   4. working-hours              — Horários de atendimento do membro
 *   5. appointments               — Consultas (passadas e futuras)
 *   6. clinical-data              — Perfis clínicos e alertas dos pacientes
 *   7. records                    — Evoluções clínicas (SOAP)
 *   8. form-templates             — Templates públicos de formulários clínicos
 *   9. ai-agent-profiles          — Perfis de agentes de IA clínicos
 *  10. clinical-document-templates — Templates padrão de documentos clínicos
 *  11. subscriptions              — Assinaturas de profissionais
 */
import {main as seedClinic} from './seeds/clinic.seed';
import {main as seedClinicalData} from './seeds/clinical-data.seed';
import {main as seedClinicalDocumentTemplates} from './seeds/clinical-document-templates.seed';
import {main as seedFormTemplates} from './seeds/form-templates.seed';
import {main as seedPatients} from './seeds/patients.seed';
import {main as seedRecords} from './seeds/records.seed';
import {main as seedSubscriptions} from './seeds/subscriptions.seed';
import {main as seedTeam} from './seeds/team.seed';
import {main as seedWorkingHours} from './seeds/working-hours.seed';

async function main() {
    console.log('=== Iniciando seeds de desenvolvimento ===\n');

    console.log('--- [1/11] Clínica + admin ---');
    await seedClinic();
    console.log('');

    console.log('--- [2/11] Equipe (outros profissionais + secretária) ---');
    await seedTeam();
    console.log('');

    console.log('--- [3/11] Pacientes ---');
    await seedPatients();
    console.log('');

    console.log('--- [4/11] Horários de atendimento ---');
    await seedWorkingHours();
    console.log('');

    console.log('--- [5/11] Consultas ---');
    await seedAppointments();
    console.log('');

    console.log('--- [6/11] Perfis clínicos e alertas ---');
    await seedClinicalData();
    console.log('');

    console.log('--- [7/11] Evoluções clínicas ---');
    await seedRecords();
    console.log('');

    console.log('--- [8/11] Templates de formulários ---');
    await seedFormTemplates();
    console.log('');

    console.log('--- [9/11] Perfis de agentes de IA ---');
    await seedAiAgentProfiles();
    console.log('');

    console.log('--- [10/11] Templates de documentos clínicos ---');
    await seedClinicalDocumentTemplates();
    console.log('');

    console.log('--- [11/11] Assinaturas de profissionais ---');
    await seedSubscriptions();
    console.log('');

    console.log('=== Seeds concluídos com sucesso! ===');
    console.log('');
    console.log('Credenciais do admin:');
    console.log('  Email:    admin@agenda.dev');
    console.log('  Senha:    Admin@123456');
    console.log('  Username: admin');
    console.log('');
    console.log('Outros logins (mesma senha):');
    console.log('  beatriz@agenda.dev  — Beatriz Costa (Psicóloga)');
    console.log('  carlos@agenda.dev   — Carlos Mendes (Nutricionista)');
    console.log('  ana@agenda.dev      — Ana Souza (Secretária)');
}

main().catch((error) => {
    console.error('Erro ao executar seeds:', error);
    process.exit(1);
});
