import {ObfuscatedPassword} from '../obfuscated-password.vo';

describe('A value object representing an obfuscated password', () => {
    it.each(['Pa$$w0rd', '4BIG_password_here_with_symbol_and_number_1!'])(
        'should obfuscate a raw password',
        async (password) => {
            await expect(ObfuscatedPassword.obfuscate(password)).not.toReject();
        }
    );

    it.each(['Pa1!', 'password', 'Password', 'Password1', 'Pa$sword', 'pa$sword1'])(
        'should reject invalid raw passwords',
        async (password) => {
            await expect(ObfuscatedPassword.obfuscate(password)).toReject();
        }
    );

    it('should verify a password', async () => {
        const obfuscated = await ObfuscatedPassword.obfuscate('4SecureP@ssword');

        await expect(obfuscated.verify('4SecureP@ssword')).resolves.toBe(true);
        await expect(obfuscated.verify('an0therSecureP@ssword')).resolves.toBe(false);
    });

    it('should behave equally after encoding/decoding', async () => {
        const obfuscatedOriginal = await ObfuscatedPassword.obfuscate('4SecureP@ssword');

        await expect(obfuscatedOriginal.verify('4SecureP@ssword')).resolves.toBe(true);

        const encoded = obfuscatedOriginal.encode();

        const decoded = ObfuscatedPassword.decode(encoded);

        await expect(decoded.verify('4SecureP@ssword')).resolves.toBe(true);

        await expect(decoded.verify('an0therSecureP@ssword')).resolves.toBe(false);
    });

    it('should fail when decoding invalid string', () => {
        expect(() => ObfuscatedPassword.decode('foo')).toThrowWithMessage(Error, 'Invalid obfuscated password format.');
    });

    it('should fail to obfuscate when node crypto fails', async () => {
        jest.resetModules();
        jest.mock('crypto', () => ({
            ...jest.requireActual('crypto'),
            scrypt: jest
                .fn(jest.requireActual('crypto').scrypt)
                .mockImplementation((_, __, ___, cb: (err: Error | null, derivedKey: Buffer) => void) =>
                    cb(new Error('Unknown error'), Buffer.from(''))
                ),
        }));

        const {ObfuscatedPassword: LocalObfuscatedPassword} = await import('../obfuscated-password.vo');

        await expect(LocalObfuscatedPassword.obfuscate('4SecureP@ssword')).rejects.toThrowWithMessage(
            Error,
            'Unknown error'
        );
    });

    it('should fail to verify a password when node crypto fails', async () => {
        const obfuscated = await ObfuscatedPassword.obfuscate('4SecureP@ssword');

        jest.resetModules();
        jest.mock('crypto', () => ({
            ...jest.requireActual('crypto'),
            scrypt: jest
                .fn(jest.requireActual('crypto').scrypt)
                .mockImplementation((_, __, ___, cb: (err: Error | null, derivedKey: Buffer) => void) =>
                    cb(new Error('Unknown error'), Buffer.from(''))
                ),
        }));

        const {ObfuscatedPassword: LocalObfuscatedPassword} = await import('../obfuscated-password.vo');

        const decoded = LocalObfuscatedPassword.decode(obfuscated.encode());

        await expect(decoded.verify('4SecureP@ssword')).rejects.toThrowWithMessage(Error, 'Unknown error');
    });
});
