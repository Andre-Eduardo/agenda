/**
 * Grupos de especialidade para roteamento do agente de IA.
 *
 * Campo livre no Professional (specialty: string) descreve a especialidade humana.
 * Este enum mapeia a especialidade para o grupo correto de agente de IA.
 */
export enum AiSpecialtyGroup {
    SAUDE_MENTAL = 'SAUDE_MENTAL',
    REABILITACAO = 'REABILITACAO',
    MEDICINA_GERAL = 'MEDICINA_GERAL',
    MEDICINA_ESPECIALIZADA = 'MEDICINA_ESPECIALIZADA',
    NUTRICAO_DIETETICA = 'NUTRICAO_DIETETICA',
    ENFERMAGEM = 'ENFERMAGEM',
    OUTROS = 'OUTROS',
}

/**
 * Infere o grupo de especialidade a partir do texto livre do campo `specialty`.
 * Usado para preencher `specialtyNormalized` automaticamente no cadastro de profissional.
 */
export function inferSpecialtyGroup(specialty: string): AiSpecialtyGroup {
    const normalized = specialty
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/[̀-ͯ]/g, '')
        .replaceAll(/[^a-z0-9\s]/g, ' ')
        .replaceAll(/\s+/g, ' ')
        .trim();

    if (/psicolog|psiquiatr|neuropsicolog|terapeut|psicanali/.test(normalized)) {
        return AiSpecialtyGroup.SAUDE_MENTAL;
    }

    if (/fisioter|fonoaudio|terapia ocupac|reabilit/.test(normalized)) {
        return AiSpecialtyGroup.REABILITACAO;
    }

    if (/nutric|dietetic|nutricion/.test(normalized)) {
        return AiSpecialtyGroup.NUTRICAO_DIETETICA;
    }

    if (/enfermag|enfermei/.test(normalized)) {
        return AiSpecialtyGroup.ENFERMAGEM;
    }

    if (/clinica geral|medic(ina)? (de )?famil|medic(ina)? prevent/.test(normalized)) {
        return AiSpecialtyGroup.MEDICINA_GERAL;
    }

    if (/medic|cardiolog|dermatolog|ortoped|neurolog|pediatr|ginecolog|urologis|oftalm|otorrino/.test(normalized)) {
        return AiSpecialtyGroup.MEDICINA_ESPECIALIZADA;
    }

    return AiSpecialtyGroup.OUTROS;
}
