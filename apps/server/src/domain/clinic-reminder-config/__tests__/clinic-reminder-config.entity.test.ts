import {InvalidInputException} from '@domain/@shared/exceptions';
import {ReminderChannel} from '@domain/appointment-reminder/entities';
import {ClinicReminderConfig} from '@domain/clinic-reminder-config/entities';
import {DEFAULT_REMINDER_MESSAGE_TEMPLATE} from '@domain/clinic-reminder-config/reminder-message-template';
import {ClinicId} from '@domain/clinic/entities';

describe('A clinic reminder config', () => {
    const clinicId = ClinicId.generate();

    function config(): ClinicReminderConfig {
        return ClinicReminderConfig.create({
            clinicId,
            enabledChannels: [ReminderChannel.WHATSAPP],
            hoursBeforeList: [24],
        });
    }

    it('should default to WhatsApp 24 h before, the default text and inactive', () => {
        const defaults = ClinicReminderConfig.defaultFor(clinicId);

        expect(defaults).toMatchObject({
            enabledChannels: [ReminderChannel.WHATSAPP],
            hoursBeforeList: [24],
            messageTemplate: null,
            isActive: false,
        });
        expect(defaults.resolveMessageTemplate()).toBe(DEFAULT_REMINDER_MESSAGE_TEMPLATE);
    });

    it('should keep lead times unique and largest first, and channels unique', () => {
        const entity = config();

        entity.configure({
            enabledChannels: [ReminderChannel.EMAIL, ReminderChannel.EMAIL, ReminderChannel.WHATSAPP],
            hoursBeforeList: [2, 48, 2],
        });

        expect(entity.enabledChannels).toEqual([ReminderChannel.EMAIL, ReminderChannel.WHATSAPP]);
        expect(entity.hoursBeforeList).toEqual([48, 2]);
    });

    it('should store a custom text trimmed and go back to the default on blank or null', () => {
        const entity = config();

        entity.configure({messageTemplate: '  Oi {{paciente}}  '});
        expect(entity.messageTemplate).toBe('Oi {{paciente}}');
        expect(entity.resolveMessageTemplate()).toBe('Oi {{paciente}}');

        entity.configure({messageTemplate: '   '});
        expect(entity.messageTemplate).toBeNull();

        entity.configure({messageTemplate: 'Oi'});
        entity.configure({messageTemplate: null});
        expect(entity.messageTemplate).toBeNull();
    });

    it('should keep the text when it is omitted', () => {
        const entity = config();

        entity.configure({messageTemplate: 'Oi {{paciente}}'});
        entity.configure({isActive: false});

        expect(entity.messageTemplate).toBe('Oi {{paciente}}');
    });

    it.each([
        ['no channel', {enabledChannels: []}],
        ['SMS, which has no provider', {enabledChannels: [ReminderChannel.SMS]}],
        ['no lead time', {hoursBeforeList: []}],
        ['more than 3 lead times', {hoursBeforeList: [72, 48, 24, 2]}],
        ['a lead time of 0 h', {hoursBeforeList: [0]}],
        ['a lead time over one week', {hoursBeforeList: [169]}],
        ['a fractional lead time', {hoursBeforeList: [1.5]}],
        ['an unknown variable', {messageTemplate: 'Oi {{nome}}'}],
        ['a text over 1000 characters', {messageTemplate: 'a'.repeat(1001)}],
    ])('should reject %s', (_, props) => {
        expect(() => config().configure(props)).toThrow(InvalidInputException);
    });
});
