import {describe, expect, it} from 'vitest';
import {
    describeLeadTime,
    insertVariable,
    parseLeadTimes,
    unknownVariables,
    validateReminderForm,
    type ReminderForm,
} from './utils';

const valid: ReminderForm = {
    isActive: true,
    channels: ['WHATSAPP'],
    leadTimes: ['24'],
    messageTemplate: 'Olá, {{paciente}}! Sua consulta é {{data}} às {{hora}}.',
};

describe('Reminder section helpers', () => {
    it('should accept a valid form', () => {
        expect(validateReminderForm(valid)).toEqual({});
    });

    it('should require a channel and a lead time', () => {
        expect(validateReminderForm({...valid, channels: [], leadTimes: []})).toEqual({
            channels: 'Escolha pelo menos um canal.',
            leadTimes: 'Defina pelo menos uma antecedência.',
        });
    });

    it.each([['0'], ['169'], ['1.5'], [''], ['abc']])('should reject the lead time "%s"', (value) => {
        expect(validateReminderForm({...valid, leadTimes: [value]}).leadTimes).toBeDefined();
    });

    it('should reject unknown variables and long texts', () => {
        expect(validateReminderForm({...valid, messageTemplate: 'Oi {{nome}}'}).messageTemplate).toBe(
            'Variável desconhecida: {{nome}}.'
        );
        expect(validateReminderForm({...valid, messageTemplate: 'a'.repeat(1001)}).messageTemplate).toBeDefined();
    });

    it('should parse lead times unique and largest first', () => {
        expect(parseLeadTimes(['2', ' 48 ', '2'])).toEqual([48, 2]);
        expect(parseLeadTimes(['2', 'x'])).toBeNull();
    });

    it('should list unknown variables once, ignoring spaces', () => {
        expect(unknownVariables('{{ paciente }} {{nome}} {{nome}}')).toEqual(['nome']);
    });

    it.each([
        [2, '2 h antes'],
        [24, '24 h antes (1 dia)'],
        [36, '36 h antes (1 dia e 12 h)'],
        [168, '168 h antes (7 dias)'],
    ])('should describe %i hours', (hours, expected) => {
        expect(describeLeadTime(hours)).toBe(expected);
    });

    it('should insert a variable at the cursor, replacing the selection', () => {
        expect(insertVariable('Olá, !', 'paciente', 5, 5)).toEqual({text: 'Olá, {{paciente}}!', cursor: 17});
        expect(insertVariable('Olá, X!', 'paciente', 5, 6)).toEqual({text: 'Olá, {{paciente}}!', cursor: 17});
        expect(insertVariable('Oi', 'hora', null, null)).toEqual({text: 'Oi{{hora}}', cursor: 10});
    });
});
