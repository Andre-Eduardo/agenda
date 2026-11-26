import {
    DEFAULT_REMINDER_MESSAGE_TEMPLATE,
    findUnknownReminderVariables,
    formatReminderDate,
    formatReminderTime,
    renderReminderMessage,
} from '@domain/clinic-reminder-config/reminder-message-template';

describe('The reminder message template', () => {
    const values = {
        paciente: 'Maria',
        data: '01/12/2026',
        hora: '10:30',
        profissional: 'Dra. Ana',
        clinica: 'Clínica Bem Estar',
    };

    it('should fill every variable of the default text', () => {
        expect(renderReminderMessage(DEFAULT_REMINDER_MESSAGE_TEMPLATE, values)).toBe(
            'Olá, Maria! Lembramos que você tem uma consulta agendada para 01/12/2026 às 10:30 com Dra. Ana. ' +
                'Em caso de imprevisto, entre em contato com Clínica Bem Estar.'
        );
    });

    it('should accept spaces inside the braces and repeated variables', () => {
        expect(renderReminderMessage('{{ paciente }}, {{paciente}}: {{hora}}', values)).toBe('Maria, Maria: 10:30');
    });

    it('should leave unknown placeholders untouched', () => {
        expect(renderReminderMessage('Oi {{nome}}', values)).toBe('Oi {{nome}}');
    });

    it('should list unknown variables once', () => {
        expect(findUnknownReminderVariables('{{nome}} {{paciente}} {{nome}} {{ endereco }}')).toEqual([
            'nome',
            'endereco',
        ]);
        expect(findUnknownReminderVariables(DEFAULT_REMINDER_MESSAGE_TEMPLATE)).toEqual([]);
    });

    it('should format date and time in Brasília time', () => {
        const startAt = new Date('2026-12-01T13:30:00Z');

        expect(formatReminderDate(startAt)).toBe('01/12/2026');
        expect(formatReminderTime(startAt)).toBe('10:30');
    });
});
