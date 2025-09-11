import {Email} from '../email.vo';

describe('A value object representing an email', () => {
    it.each<string>([
        'john.doe@ecxus.com.br',
        'vadimmoiseenkov@timspeak.ru',
        'gutamba@ghost-mailer.com',
        'uvstamm@domaain37.online',
    ])('can be created from a valid string', (email) => {
        expect(() => Email.create(email)).not.toThrow();
        expect(Email.create(email)).toBeInstanceOf(Email);
    });

    it.each(['john', 'john.doe', 'john.doe@', 'john.doe@.', 'john.doe@com', 'john.doe@com.', 'john.doe@com.b'])(
        'should reject invalid values',
        (email) => {
            expect(() => Email.validate(email)).toThrow('Invalid email format.');
        }
    );

    it('should be comparable', () => {
        const email = Email.create('john.doe@ecxus.com.br');
        const email2 = Email.create('john.doe@ecxus.com.br');
        const email3 = Email.create('maria.cross@ecxus.com.br');
        const email4 = Email.create('JOHN.doe@ecxus.com.br');

        expect(email.equals(email2)).toBe(true);
        expect(email.equals(email3)).toBe(false);
        expect(email.equals(email4)).toBe(true);
    });

    it('can be converted to a string', () => {
        const email = Email.create('john.doe@ecxus.com.br');
        const email2 = Email.create('JOHN.doe@ecxus.com.br');

        expect(email.toString()).toEqual('john.doe@ecxus.com.br');
        expect(email2.toString()).toEqual('JOHN.doe@ecxus.com.br');
    });

    it('can be converted to a JSON', () => {
        const email = Email.create('john.doe@ecxus.com.br');
        const email2 = Email.create('JOHN.doe@ecxus.com.br');

        expect(email.toJSON()).toEqual('john.doe@ecxus.com.br');
        expect(email2.toJSON()).toEqual('JOHN.doe@ecxus.com.br');
    });
});
