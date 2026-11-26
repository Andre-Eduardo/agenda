import * as crypto from 'crypto';
import {SnsMessageVerifier, type SnsMessage} from '../sns-message-verifier';

const {privateKey, publicKey} = crypto.generateKeyPairSync('rsa', {modulusLength: 2048});
const publicPem = publicKey.export({type: 'spki', format: 'pem'}).toString();

class TestVerifier extends SnsMessageVerifier {
    readonly fetched: string[] = [];

    protected override fetchCertificate(url: string): Promise<string> {
        this.fetched.push(url);

        return Promise.resolve(publicPem);
    }
}

function signed(message: Omit<SnsMessage, 'Signature'>, algorithm = 'RSA-SHA256'): SnsMessage {
    const signer = crypto.createSign(algorithm);

    signer.update(SnsMessageVerifier.stringToSign({...message, Signature: ''}));

    return {...message, Signature: signer.sign(privateKey, 'base64')};
}

describe('An SNS message verifier', () => {
    const notification = {
        Type: 'Notification' as const,
        MessageId: 'sns-1',
        TopicArn: 'arn:aws:sns:sa-east-1:123:ses-events',
        Message: '{"eventType":"Delivery"}',
        Timestamp: '2026-11-30T13:00:00.000Z',
        SignatureVersion: '2' as const,
        SigningCertURL: 'https://sns.sa-east-1.amazonaws.com/SimpleNotificationService-abc.pem',
    };

    it('should build the notification string to sign without an absent subject', () => {
        expect(SnsMessageVerifier.stringToSign({...notification, Signature: ''})).toBe(
            'Message\n{"eventType":"Delivery"}\nMessageId\nsns-1\nTimestamp\n2026-11-30T13:00:00.000Z\n' +
                'TopicArn\narn:aws:sns:sa-east-1:123:ses-events\nType\nNotification\n'
        );
    });

    it('should accept a valid signature (v2 and v1) and cache the certificate', async () => {
        const verifier = new TestVerifier();

        await expect(verifier.verify(signed(notification))).resolves.toBe(true);
        await expect(verifier.verify(signed({...notification, SignatureVersion: '1'}, 'RSA-SHA1'))).resolves.toBe(true);
        expect(verifier.fetched).toHaveLength(1);
    });

    it('should reject a tampered message', async () => {
        const message = signed(notification);

        await expect(new TestVerifier().verify({...message, Message: '{"eventType":"Bounce"}'})).resolves.toBe(false);
    });

    it.each([
        'http://sns.sa-east-1.amazonaws.com/cert.pem',
        'https://sns.sa-east-1.amazonaws.com.evil.com/cert.pem',
        'https://evil.com/sns.sa-east-1.amazonaws.com/cert.pem',
        'https://sns.sa-east-1.amazonaws.com/cert.txt',
    ])('should not fetch a certificate from %s', async (SigningCertURL) => {
        const verifier = new TestVerifier();

        await expect(verifier.verify(signed({...notification, SigningCertURL}))).resolves.toBe(false);
        expect(verifier.fetched).toEqual([]);
    });

    it('should only confirm subscriptions on an SNS host', async () => {
        await expect(
            new TestVerifier().confirmSubscription({
                ...notification,
                Type: 'SubscriptionConfirmation',
                Signature: '',
                SubscribeURL: 'https://evil.com/confirm',
            })
        ).rejects.toThrow('SubscribeURL is not an SNS endpoint');
    });
});
