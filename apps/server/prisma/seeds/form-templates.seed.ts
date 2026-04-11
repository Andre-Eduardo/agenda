/**
 * Seed: Public form templates for the clinical forms module.
 * Run via: ts-node prisma/seeds/form-templates.seed.ts
 * Or integrate into a main seed file.
 *
 * Templates seeded:
 * - anamnese_medica_basica (MEDICINA)
 * - avaliacao_psicologica_inicial (PSICOLOGIA)
 * - avaliacao_fisioterapeutica_inicial (FISIOTERAPIA)
 */
import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const now = new Date();

    // -----------------------------------------------------------------------
    // 1. ANAMNESE MÉDICA BÁSICA
    // -----------------------------------------------------------------------
    const medTemplate = await prisma.formTemplate.upsert({
        where: {code: 'anamnese_medica_basica'},
        create: {
            id: randomUUID(),
            code: 'anamnese_medica_basica',
            name: 'Anamnese Médica Básica',
            description: 'Coleta de dados clínicos iniciais para consulta médica geral.',
            specialty: 'MEDICINA',
            isPublic: true,
            createdAt: now,
            updatedAt: now,
        },
        update: {name: 'Anamnese Médica Básica', updatedAt: now},
    });

    await prisma.formTemplateVersion.upsert({
        where: {form_template_version_unique: {templateId: medTemplate.id, versionNumber: 1}},
        create: {
            id: randomUUID(),
            templateId: medTemplate.id,
            versionNumber: 1,
            status: 'PUBLISHED',
            publishedAt: now,
            createdAt: now,
            updatedAt: now,
            definitionJson: {
                id: 'anamnese_medica_basica',
                name: 'Anamnese Médica Básica',
                specialty: 'MEDICINA',
                category: 'ANAMNESE',
                sections: [
                    {
                        id: 'sec_queixa',
                        label: 'Queixa Principal',
                        order: 1,
                        fields: [
                            {id: 'queixa_principal', type: 'textarea', label: 'Queixa Principal', required: true, order: 1},
                            {id: 'duracao_sintomas', type: 'text', label: 'Duração dos Sintomas', required: true, order: 2},
                        ],
                    },
                    {
                        id: 'sec_historico',
                        label: 'Histórico de Saúde',
                        order: 2,
                        fields: [
                            {id: 'doencas_previas', type: 'textarea', label: 'Doenças Prévias', required: false, order: 1},
                            {id: 'cirurgias', type: 'textarea', label: 'Cirurgias Anteriores', required: false, order: 2},
                            {id: 'alergias', type: 'textarea', label: 'Alergias Conhecidas', required: false, order: 3},
                            {id: 'medicamentos_atuais', type: 'textarea', label: 'Medicamentos em Uso', required: false, order: 4},
                        ],
                    },
                    {
                        id: 'sec_habitos',
                        label: 'Hábitos de Vida',
                        order: 3,
                        fields: [
                            {
                                id: 'tabagismo',
                                type: 'select',
                                label: 'Tabagismo',
                                required: false,
                                order: 1,
                                options: [
                                    {value: 'nao_fumante', label: 'Não fumante'},
                                    {value: 'ex_fumante', label: 'Ex-fumante'},
                                    {value: 'fumante', label: 'Fumante atual'},
                                ],
                            },
                            {
                                id: 'etilismo',
                                type: 'select',
                                label: 'Consumo de Álcool',
                                required: false,
                                order: 2,
                                options: [
                                    {value: 'nao', label: 'Não consome'},
                                    {value: 'social', label: 'Social/eventual'},
                                    {value: 'frequente', label: 'Frequente'},
                                ],
                            },
                            {id: 'atividade_fisica', type: 'text', label: 'Atividade Física', required: false, order: 3},
                        ],
                    },
                ],
                scoring: {enabled: false},
            },
        },
        update: {status: 'PUBLISHED', publishedAt: now, updatedAt: now},
    });

    // -----------------------------------------------------------------------
    // 2. AVALIAÇÃO PSICOLÓGICA INICIAL
    // -----------------------------------------------------------------------
    const psyTemplate = await prisma.formTemplate.upsert({
        where: {code: 'avaliacao_psicologica_inicial'},
        create: {
            id: randomUUID(),
            code: 'avaliacao_psicologica_inicial',
            name: 'Avaliação Psicológica Inicial',
            description: 'Formulário de avaliação psicológica para primeira sessão.',
            specialty: 'PSICOLOGIA',
            isPublic: true,
            createdAt: now,
            updatedAt: now,
        },
        update: {name: 'Avaliação Psicológica Inicial', updatedAt: now},
    });

    await prisma.formTemplateVersion.upsert({
        where: {form_template_version_unique: {templateId: psyTemplate.id, versionNumber: 1}},
        create: {
            id: randomUUID(),
            templateId: psyTemplate.id,
            versionNumber: 1,
            status: 'PUBLISHED',
            publishedAt: now,
            createdAt: now,
            updatedAt: now,
            definitionJson: {
                id: 'avaliacao_psicologica_inicial',
                name: 'Avaliação Psicológica Inicial',
                specialty: 'PSICOLOGIA',
                category: 'AVALIACAO',
                sections: [
                    {
                        id: 'sec_motivo',
                        label: 'Motivo da Consulta',
                        order: 1,
                        fields: [
                            {id: 'motivo_busca', type: 'textarea', label: 'O que o trouxe até aqui?', required: true, order: 1},
                            {id: 'expectativas', type: 'textarea', label: 'Quais são suas expectativas com a terapia?', required: false, order: 2},
                        ],
                    },
                    {
                        id: 'sec_saude_mental',
                        label: 'Saúde Mental',
                        order: 2,
                        fields: [
                            {
                                id: 'humor_predominante',
                                type: 'select',
                                label: 'Humor Predominante nas Últimas Semanas',
                                required: true,
                                order: 1,
                                options: [
                                    {value: 'muito_bom', label: 'Muito bom'},
                                    {value: 'bom', label: 'Bom'},
                                    {value: 'neutro', label: 'Neutro'},
                                    {value: 'ruim', label: 'Ruim'},
                                    {value: 'muito_ruim', label: 'Muito ruim'},
                                ],
                            },
                            {id: 'ansiedade', type: 'number', label: 'Nível de Ansiedade (0-10)', required: false, order: 2, validation: {min: 0, max: 10}},
                            {id: 'depressao', type: 'number', label: 'Nível de Tristeza/Depressão (0-10)', required: false, order: 3, validation: {min: 0, max: 10}},
                            {id: 'qualidade_sono', type: 'select', label: 'Qualidade do Sono', required: false, order: 4, options: [
                                {value: 'boa', label: 'Boa'},
                                {value: 'regular', label: 'Regular'},
                                {value: 'ruim', label: 'Ruim'},
                            ]},
                        ],
                    },
                    {
                        id: 'sec_historico_familiar',
                        label: 'Histórico Familiar',
                        order: 3,
                        fields: [
                            {id: 'historico_transtornos', type: 'textarea', label: 'Histórico familiar de transtornos mentais', required: false, order: 1},
                            {id: 'relacionamento_familiar', type: 'select', label: 'Relacionamento familiar atual', required: false, order: 2, options: [
                                {value: 'harmonioso', label: 'Harmonioso'},
                                {value: 'com_conflitos', label: 'Com conflitos'},
                                {value: 'distante', label: 'Distante'},
                            ]},
                        ],
                    },
                ],
                scoring: {enabled: false},
            },
        },
        update: {status: 'PUBLISHED', publishedAt: now, updatedAt: now},
    });

    // -----------------------------------------------------------------------
    // 3. AVALIAÇÃO FISIOTERAPÊUTICA INICIAL
    // -----------------------------------------------------------------------
    const physioTemplate = await prisma.formTemplate.upsert({
        where: {code: 'avaliacao_fisioterapeutica_inicial'},
        create: {
            id: randomUUID(),
            code: 'avaliacao_fisioterapeutica_inicial',
            name: 'Avaliação Fisioterapêutica Inicial',
            description: 'Formulário de avaliação para primeira sessão de fisioterapia.',
            specialty: 'FISIOTERAPIA',
            isPublic: true,
            createdAt: now,
            updatedAt: now,
        },
        update: {name: 'Avaliação Fisioterapêutica Inicial', updatedAt: now},
    });

    await prisma.formTemplateVersion.upsert({
        where: {form_template_version_unique: {templateId: physioTemplate.id, versionNumber: 1}},
        create: {
            id: randomUUID(),
            templateId: physioTemplate.id,
            versionNumber: 1,
            status: 'PUBLISHED',
            publishedAt: now,
            createdAt: now,
            updatedAt: now,
            definitionJson: {
                id: 'avaliacao_fisioterapeutica_inicial',
                name: 'Avaliação Fisioterapêutica Inicial',
                specialty: 'FISIOTERAPIA',
                category: 'AVALIACAO',
                sections: [
                    {
                        id: 'sec_queixa',
                        label: 'Queixa e Diagnóstico',
                        order: 1,
                        fields: [
                            {id: 'queixa_principal', type: 'textarea', label: 'Queixa Principal', required: true, order: 1},
                            {id: 'diagnostico_medico', type: 'text', label: 'Diagnóstico Médico (CID)', required: false, order: 2},
                            {id: 'local_dor', type: 'text', label: 'Local da Dor/Limitação', required: false, order: 3},
                            {id: 'intensidade_dor', type: 'number', label: 'Intensidade da Dor (EVA 0-10)', required: false, order: 4, validation: {min: 0, max: 10}},
                        ],
                    },
                    {
                        id: 'sec_avaliacao_funcional',
                        label: 'Avaliação Funcional',
                        order: 2,
                        fields: [
                            {id: 'limitacao_funcional', type: 'textarea', label: 'Limitações Funcionais', required: false, order: 1},
                            {id: 'amplitude_movimento', type: 'text', label: 'Amplitude de Movimento', required: false, order: 2},
                            {id: 'forca_muscular', type: 'select', label: 'Força Muscular (MRC)', required: false, order: 3, options: [
                                {value: '0', label: '0 — Sem contração'},
                                {value: '1', label: '1 — Contração visível sem movimento'},
                                {value: '2', label: '2 — Movimento sem gravidade'},
                                {value: '3', label: '3 — Movimento contra gravidade'},
                                {value: '4', label: '4 — Movimento contra resistência parcial'},
                                {value: '5', label: '5 — Força normal'},
                            ]},
                        ],
                    },
                    {
                        id: 'sec_objetivos',
                        label: 'Objetivos e Plano',
                        order: 3,
                        fields: [
                            {id: 'objetivos_tratamento', type: 'textarea', label: 'Objetivos do Tratamento', required: false, order: 1},
                            {id: 'frequencia_sessoes', type: 'select', label: 'Frequência de Sessões Sugerida', required: false, order: 2, options: [
                                {value: '1x_semana', label: '1x por semana'},
                                {value: '2x_semana', label: '2x por semana'},
                                {value: '3x_semana', label: '3x por semana'},
                                {value: 'diario', label: 'Diário'},
                            ]},
                        ],
                    },
                ],
                scoring: {enabled: false},
            },
        },
        update: {status: 'PUBLISHED', publishedAt: now, updatedAt: now},
    });

    console.log('✔ Seeded form templates: Médica, Psicológica, Fisioterapêutica');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
