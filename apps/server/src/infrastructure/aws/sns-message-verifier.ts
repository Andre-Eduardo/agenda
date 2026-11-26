import * as crypto from 'crypto';
import {Injectable} from '@nestjs/common';
import {z} from 'zod';

export const snsMessageSchema = z
    .object({
        Type: z.enum(['Notification', 'SubscriptionConfirmation', 'UnsubscribeConfirmation']),
        MessageId: z.string(),
        TopicArn: z.string(),
        Message: z.string(),
        Timestamp: z.string(),
        SignatureVersion: z.enum(['1', '2']),
        Signature: z.string(),
        SigningCertURL: z.string(),
        Subject: z.string().nullish(),
        SubscribeURL: z.string().optional(),
        Token: z.string().optional(),
    })
    .passthrough();

export type SnsMessage = z.infer<typeof snsMessageSchema>;

/** SNS endpoints are `sns.<region>.amazonaws.com` (`.com.cn` in China). */
const SNS_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/;

const NOTIFICATION_FIELDS = ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'] as const;
const SUBSCRIPTION_FIELDS = ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'] as const;

const CERT_TIMEOUT_MS = 5_000;

/**
 * Verifies Amazon SNS message signatures (https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html),
 * so only AWS can drive the SES events webhook. The signing certificate is only fetched from an
 * SNS host over HTTPS and is cached per URL.
 */
@Injectable()
export class SnsMessageVerifier {
    private readonly certificates = new Map<string, string>();

    static isSnsUrl(value: string | undefined): boolean {
        if (value === undefined) return false;

        try {
            const url = new URL(value);

            return url.protocol === 'https:' && SNS_HOST.test(url.hostname);
        } catch {
            return false;
        }
    }

    static stringToSign(message: SnsMessage): string {
        const fields = message.Type === 'Notification' ? NOTIFICATION_FIELDS : SUBSCRIPTION_FIELDS;

        return fields
            .flatMap((field) => {
                const value = message[field];

                // Subject is optional on notifications and is left out when absent.
                return value === undefined || value === null ? [] : [`${field}\n${value}\n`];
            })
            .join('');
    }

    async verify(message: SnsMessage): Promise<boolean> {
        if (!SnsMessageVerifier.isSnsUrl(message.SigningCertURL) || !message.SigningCertURL.endsWith('.pem')) {
            return false;
        }

        let certificate: string;

        try {
            certificate = await this.certificate(message.SigningCertURL);
        } catch {
            return false;
        }

        const verifier = crypto.createVerify(message.SignatureVersion === '1' ? 'RSA-SHA1' : 'RSA-SHA256');

        verifier.update(SnsMessageVerifier.stringToSign(message), 'utf8');

        try {
            return verifier.verify(certificate, message.Signature, 'base64');
        } catch {
            return false;
        }
    }

    /** Confirms an HTTPS subscription by visiting its SubscribeURL (only on an SNS host). */
    async confirmSubscription(message: SnsMessage): Promise<void> {
        if (!SnsMessageVerifier.isSnsUrl(message.SubscribeURL) || message.SubscribeURL === undefined) {
            throw new Error('SubscribeURL is not an SNS endpoint');
        }

        const response = await fetch(message.SubscribeURL, {signal: AbortSignal.timeout(CERT_TIMEOUT_MS)});

        if (!response.ok) {
            throw new Error(`SNS subscription confirmation failed with status ${response.status}`);
        }
    }

    protected async fetchCertificate(url: string): Promise<string> {
        const response = await fetch(url, {signal: AbortSignal.timeout(CERT_TIMEOUT_MS)});

        if (!response.ok) {
            throw new Error(`Could not fetch the SNS signing certificate (status ${response.status})`);
        }

        return response.text();
    }

    private async certificate(url: string): Promise<string> {
        const cached = this.certificates.get(url);

        if (cached !== undefined) return cached;

        const certificate = await this.fetchCertificate(url);

        this.certificates.set(url, certificate);

        return certificate;
    }
}
