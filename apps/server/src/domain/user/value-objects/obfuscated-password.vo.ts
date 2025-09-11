import * as crypto from 'crypto';
import validator from 'validator';
import {InvalidInputException} from '../../@shared/exceptions';

export class ObfuscatedPassword {
    private static readonly NEW_KEY_SIZE = 64;

    private static readonly ENCODING = 'base64';

    private readonly salt: Buffer;

    private readonly hash: Buffer;

    private readonly keySize: number;

    private constructor(salt: Buffer, hash: Buffer, keySize: number = ObfuscatedPassword.NEW_KEY_SIZE) {
        this.salt = salt;
        this.hash = hash;
        this.keySize = keySize;
    }

    /**
     * Obfuscates the password.
     *
     * @param password The raw password to obfuscate.
     */
    static obfuscate(password: string): Promise<ObfuscatedPassword> {
        return new Promise((resolve, reject) => {
            try {
                ObfuscatedPassword.validate(password);
            } catch (error) {
                reject(error);
            }

            const salt = crypto.randomBytes(16);

            crypto.scrypt(password, salt, ObfuscatedPassword.NEW_KEY_SIZE, (err, derivedKey) =>
                err !== null ? reject(err) : resolve(new ObfuscatedPassword(salt, derivedKey))
            );
        });
    }

    /**
     * Checks whether the password meets the necessary format requirements.
     *
     * @param password The password to validate.
     */
    static validate(password: string): void {
        if (
            !validator.isStrongPassword(password, {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
        ) {
            throw new InvalidInputException(
                'The password must be ' +
                    'at least 8 characters long ' +
                    'and contain at least one lowercase letter, ' +
                    'one uppercase letter, ' +
                    'one number, ' +
                    'and one special character.'
            );
        }
    }

    /**
     * Decodes an obfuscated password.
     *
     * @param encoded The encoded obfuscated password.
     */
    static decode(encoded: string): ObfuscatedPassword {
        try {
            const [keySize, salt, hash] = encoded.split(':', 3);

            return new ObfuscatedPassword(
                Buffer.from(salt, ObfuscatedPassword.ENCODING),
                Buffer.from(hash, ObfuscatedPassword.ENCODING),
                parseInt(keySize, 10)
            );
        } catch {
            throw Error('Invalid obfuscated password format.');
        }
    }

    encode(): string {
        const encodedSalt = this.salt.toString(ObfuscatedPassword.ENCODING);
        const encodedHash = this.hash.toString(ObfuscatedPassword.ENCODING);

        return `${this.keySize}:${encodedSalt}:${encodedHash}`;
    }

    /**
     * Checks whether the password matches the obfuscated password.
     *
     * @param password The password to verify.
     */
    verify(password: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            crypto.scrypt(password, this.salt, ObfuscatedPassword.NEW_KEY_SIZE, (err, derivedKey) =>
                err !== null
                    ? reject(err)
                    : resolve(this.hash.length === derivedKey.length && crypto.timingSafeEqual(this.hash, derivedKey))
            );
        });
    }
}
