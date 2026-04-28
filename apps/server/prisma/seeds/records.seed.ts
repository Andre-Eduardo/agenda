/**
 * Seed: Evoluções clínicas (Records) de desenvolvimento.
 *
 * Depende de: clinic.seed + patients.seed
 *
 * Cria evoluções SOAP realistas cobrindo diferentes cenários:
 *   - Ana:   3 evoluções (1ª consulta + 2 retornos), a última de fonte IMPORT
 *   - Carlos: 1 evolução (1ª consulta)
 *   - Maria:  3 evoluções (1ª consulta + 2 retornos), última com status de piora
 *   - João:   sem evoluções (paciente com dados incompletos)
 *
 * IDs fixos garantem idempotência via upsert.
 */
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

const CLINIC_ID = '00000000-0000-0000-0000-000000000010';
const MEMBER_ID = '00000000-0000-0000-0000-000000000011';
const PROFESSIONAL_ID = '00000000-0000-0000-0000-000000000004';

const PATIENT = {
    ana: '00000000-0000-0000-0001-000000000001',
    carlos: '00000000-0000-0000-0001-000000000002',
    maria: '00000000-0000-0000-0001-000000000003',
};

function daysAgo(n: number, hour = 10, minute = 0): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, minute, 0, 0);
    return d;
}

const RECORDS: {
    id: string;
    patientId: string;
    attendanceType: 'FIRST_VISIT' | 'FOLLOW_UP' | 'EVALUATION' | 'PROCEDURE' | 'TELEMEDICINE' | 'INTERCURRENCE';
    clinicalStatus: 'STABLE' | 'IMPROVING' | 'WORSENING' | 'UNCHANGED' | 'UNDER_OBSERVATION';
    templateType: 'SOAP' | null;
    source: 'MANUAL' | 'IMPORT';
    eventDate: Date;
    title: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    isLocked: boolean;
    signedAt: Date | null;
}[] = [
    // ─── Ana Beatriz (hipertensão) ────────────────────────────────────────────
    {
        id: '00000000-0000-0000-0004-000000000001',
        patientId: PATIENT.ana,
        attendanceType: 'FIRST_VISIT',
        clinicalStatus: 'UNDER_OBSERVATION',
        templateType: 'SOAP',
        source: 'MANUAL',
        eventDate: daysAgo(45, 9, 0),
        title: 'Primeira consulta — avaliação de hipertensão',
        subjective:
            'Paciente refere cefaleia occipital frequente há 3 meses, piora matinal. Histórico familiar positivo para HAS (mãe e avó). Nega tabagismo. Consumo eventual de álcool.',
        objective:
            'PA: 148/92 mmHg (média 3 aferições). FC: 82 bpm. Peso: 72 kg. Altura: 1,65 m. IMC: 26,4 kg/m². Exame físico sem alterações cardiovasculares.',
        assessment:
            'Hipertensão arterial estágio 1 — diagnóstico. Obesidade grau I. Cefaleia tensional associada.',
        plan: 'Iniciar Losartana 50 mg 1×/dia. Orientações sobre mudança de estilo de vida: redução de sódio, atividade física regular. Retorno em 30 dias com medida domiciliar de PA.',
        isLocked: true,
        signedAt: daysAgo(45, 9, 30),
    },
    {
        id: '00000000-0000-0000-0004-000000000002',
        patientId: PATIENT.ana,
        attendanceType: 'FOLLOW_UP',
        clinicalStatus: 'IMPROVING',
        templateType: 'SOAP',
        source: 'MANUAL',
        eventDate: daysAgo(14, 10, 0),
        title: 'Retorno — reavaliação após início de Losartana',
        subjective:
            'Paciente refere boa tolerância à medicação. Cefaleia reduziu significativamente. Relata adesão ao tratamento e iniciou caminhadas 3×/semana.',
        objective:
            'PA: 132/84 mmHg. FC: 76 bpm. Peso: 71,2 kg. IMC: 26,1 kg/m². Sem efeitos adversos reportados.',
        assessment:
            'Hipertensão arterial em controle parcial. Resposta inicial satisfatória à Losartana. Boa adesão ao tratamento não farmacológico.',
        plan: 'Manter Losartana 50 mg. Reforçar hábitos. Solicitar: hemograma, glicemia jejum, creatinina, sódio, potássio, EAS, ECG. Retorno em 30 dias com exames.',
        isLocked: true,
        signedAt: daysAgo(14, 10, 25),
    },
    {
        id: '00000000-0000-0000-0004-000000000003',
        patientId: PATIENT.ana,
        attendanceType: 'FOLLOW_UP',
        clinicalStatus: 'STABLE',
        templateType: 'SOAP',
        source: 'IMPORT',
        eventDate: daysAgo(3, 14, 30),
        title: 'Retorno — análise de exames e ajuste de conduta',
        subjective:
            'Paciente sem queixas. PA domiciliar média 128/80. Refere pequena piora de cefaleia nos últimos dias, possivelmente relacionada a estresse no trabalho.',
        objective:
            'PA: 130/82 mmHg. FC: 74 bpm. Exames: Glicemia 92 mg/dL, Creatinina 0,9 mg/dL, K⁺ 4,1 mEq/L, ECG sem alterações.',
        assessment:
            'Hipertensão arterial controlada. Exames dentro dos limites da normalidade. Cefaleia tensional por estresse.',
        plan: 'Manter conduta. Técnicas de relaxamento. Retorno em 60 dias ou antes se PA > 160/100.',
        isLocked: false,
        signedAt: null,
    },

    // ─── Carlos Eduardo (jovem, 1ª consulta) ─────────────────────────────────
    {
        id: '00000000-0000-0000-0004-000000000004',
        patientId: PATIENT.carlos,
        attendanceType: 'FIRST_VISIT',
        clinicalStatus: 'STABLE',
        templateType: 'SOAP',
        source: 'MANUAL',
        eventDate: daysAgo(20, 9, 0),
        title: 'Primeira consulta — check-up geral',
        subjective:
            'Paciente jovem, 23 anos, sem queixas específicas. Veio por orientação da empresa para check-up admissional. Nega doenças prévias. Atividade física regular.',
        objective:
            'PA: 118/72 mmHg. FC: 68 bpm. Peso: 78 kg. Altura: 1,82 m. IMC: 23,5 kg/m². Ausculta cardíaca e pulmonar normais. Abdome sem alterações.',
        assessment: 'Paciente jovem saudável. Exame físico sem alterações. Check-up admissional.',
        plan: 'Solicitar: hemograma, glicemia, lipidograma, creatinina, urina. Retorno com exames em 30 dias.',
        isLocked: true,
        signedAt: daysAgo(20, 9, 40),
    },

    // ─── Maria das Graças (idosa, múltiplas comorbidades) ─────────────────────
    {
        id: '00000000-0000-0000-0004-000000000005',
        patientId: PATIENT.maria,
        attendanceType: 'FIRST_VISIT',
        clinicalStatus: 'UNDER_OBSERVATION',
        templateType: 'SOAP',
        source: 'MANUAL',
        eventDate: daysAgo(60, 14, 0),
        title: 'Primeira consulta — avaliação geral de paciente com múltiplas comorbidades',
        subjective:
            'Paciente de 75 anos encaminhada pelo clínico geral. Queixa de fadiga, poliúria e dores articulares nos joelhos e punhos há 6 meses. DM2 diagnosticada há 12 anos, HAS há 20 anos, AR há 5 anos. Alergia conhecida à penicilina (anafilaxia).',
        objective:
            'PA: 152/90 mmHg. FC: 80 bpm. Peso: 68 kg. Altura: 1,58 m. IMC: 27,2 kg/m². Glicemia capilar: 186 mg/dL. Articulações: edema bilateral de punhos, crepitação em joelhos.',
        assessment:
            'DM2 descompensada (HbA1c 8,9%). HAS descontrolada. AR ativa. Polifarmácia — necessário revisar.',
        plan: 'Ajustar Metformina 850 mg 2×/dia. Adicionar Losartana 50 mg. Solicitar HbA1c, creatinina, TSH, VHS, PCR, fator reumatoide. Encaminhar reumatologia para AR. Manter prednisona. Retorno 30 dias.',
        isLocked: true,
        signedAt: daysAgo(60, 14, 50),
    },
    {
        id: '00000000-0000-0000-0004-000000000006',
        patientId: PATIENT.maria,
        attendanceType: 'FOLLOW_UP',
        clinicalStatus: 'IMPROVING',
        templateType: 'SOAP',
        source: 'MANUAL',
        eventDate: daysAgo(30, 14, 0),
        title: 'Retorno — acompanhamento mensal',
        subjective:
            'Paciente refere melhora da fadiga após ajuste da medicação. Poliúria diminuiu. Dores articulares estáveis, sem piora. Boa adesão ao tratamento.',
        objective:
            'PA: 138/86 mmHg. FC: 78 bpm. Glicemia capilar: 142 mg/dL. HbA1c: 7,8%. Edema de punhos reduzido.',
        assessment:
            'DM2 com melhora parcial do controle glicêmico. HAS com resposta inicial à Losartana. AR estável.',
        plan: 'Manter esquema atual. Reforçar dieta hipoglicídica e hipossódica. Próxima consulta com reumatologista agendada. Retorno 30 dias.',
        isLocked: true,
        signedAt: daysAgo(30, 14, 45),
    },
    {
        id: '00000000-0000-0000-0004-000000000007',
        patientId: PATIENT.maria,
        attendanceType: 'FOLLOW_UP',
        clinicalStatus: 'STABLE',
        templateType: 'SOAP',
        source: 'MANUAL',
        eventDate: daysAgo(7, 14, 0),
        title: 'Retorno — acompanhamento mensal',
        subjective:
            'Paciente estável. Sem novas queixas. Relata episódio de hipoglicemia leve semana passada (glicemia 62 mg/dL), que reverteu com ingesta de suco. Pressão domiciliar em torno de 135/82.',
        objective:
            'PA: 136/84 mmHg. FC: 76 bpm. Glicemia capilar: 118 mg/dL (pós-prandial 2h). Peso estável.',
        assessment:
            'DM2 controlada (risco de hipoglicemia com Metformina em dose plena). HAS controlada. AR em remissão parcial (relatório reumatologista).',
        plan: 'Reduzir Metformina para 500 mg 2×/dia e reavaliar. Orientar sobre reconhecimento e manejo de hipoglicemia. Retorno 45 dias.',
        isLocked: true,
        signedAt: daysAgo(7, 14, 40),
    },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function main() {
    const now = new Date();

    for (const r of RECORDS) {
        await prisma.record.upsert({
            where: {id: r.id},
            create: {
                id: r.id,
                clinicId: CLINIC_ID,
                createdByMemberId: MEMBER_ID,
                responsibleProfessionalId: PROFESSIONAL_ID,
                patientId: r.patientId,
                attendanceType: r.attendanceType,
                clinicalStatus: r.clinicalStatus,
                templateType: r.templateType,
                source: r.source,
                title: r.title,
                subjective: r.subjective,
                objective: r.objective,
                assessment: r.assessment,
                plan: r.plan,
                eventDate: r.eventDate,
                isLocked: r.isLocked,
                signedAt: r.signedAt,
                signedByMemberId: r.isLocked ? MEMBER_ID : null,
                wasHumanEdited: r.source === 'IMPORT',
                createdAt: r.eventDate,
                updatedAt: now,
            },
            update: {
                title: r.title,
                subjective: r.subjective,
                objective: r.objective,
                assessment: r.assessment,
                plan: r.plan,
                clinicalStatus: r.clinicalStatus,
                isLocked: r.isLocked,
                signedAt: r.signedAt,
                signedByMemberId: r.isLocked ? MEMBER_ID : null,
                updatedAt: now,
            },
        });

        const patientKey = Object.entries(PATIENT).find(([, v]) => v === r.patientId)?.[0] ?? '?';
        console.log(
            `✔ Record [${r.source}][${r.isLocked ? 'locked' : 'draft '}] ${patientKey} — ${r.title.slice(0, 50)}`,
        );
    }

    console.log(`\nTotal: ${RECORDS.length} evoluções criadas.`);
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
