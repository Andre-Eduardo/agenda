export type PasswordResetEmail = {
    /** Recipient e-mail address. */
    to: string;
    /** Name used in the greeting. */
    name: string;
    /** Link to the web page where the new password is chosen. */
    resetUrl: string;
    /** How long the link stays valid, in minutes. */
    expiresInMinutes: number;
};

/**
 * Port that delivers the password-reset e-mail. Implementations must not throw for delivery
 * problems: they log and return false, so the API answer never reveals whether an account exists.
 */
export interface PasswordResetMailer {
    send(email: PasswordResetEmail): Promise<boolean>;
}

export abstract class PasswordResetMailer {}
