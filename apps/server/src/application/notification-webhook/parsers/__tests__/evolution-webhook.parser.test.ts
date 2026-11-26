import {parseEvolutionWebhook, whatsAppNumberVariants} from '../evolution-webhook.parser';

describe('The Evolution webhook parser', () => {
    const now = new Date('2026-11-30T13:30:00Z');

    it('should read a delivery ack of a message the clinic sent', () => {
        const body = {
            event: 'messages.update',
            instance: 'clinic',
            date_time: '2026-11-30T13:31:00.000Z',
            data: {keyId: 'msg-1', remoteJid: '5511987654321@s.whatsapp.net', fromMe: true, status: 'DELIVERY_ACK'},
        };

        expect(parseEvolutionWebhook(body, now)).toEqual([
            {kind: 'status', messageId: 'msg-1', status: 'DELIVERED', occurredAt: new Date('2026-11-30T13:31:00.000Z')},
        ]);
    });

    it.each([
        ['READ', 'READ'],
        ['PLAYED', 'READ'],
        ['ERROR', 'ERROR'],
        [3, 'DELIVERED'],
        [4, 'READ'],
    ])('should map the %p ack to %s', (status, expected) => {
        const body = {event: 'MESSAGES_UPDATE', data: [{key: {id: 'msg-1', fromMe: true}, update: {status}}]};

        expect(parseEvolutionWebhook(body, now)).toEqual([
            {kind: 'status', messageId: 'msg-1', status: expected, occurredAt: now},
        ]);
    });

    it('should drop server acks and acks of messages the patient sent', () => {
        expect(parseEvolutionWebhook({event: 'messages.update', data: {keyId: 'a', status: 'SERVER_ACK'}})).toEqual([]);
        expect(
            parseEvolutionWebhook({event: 'messages.update', data: {keyId: 'a', fromMe: false, status: 'READ'}})
        ).toEqual([]);
    });

    it('should read a patient reply quoting the reminder', () => {
        const body = {
            event: 'messages.upsert',
            data: {
                key: {id: 'in-1', remoteJid: '551187654321@s.whatsapp.net', fromMe: false},
                message: {extendedTextMessage: {text: 'Confirmo', contextInfo: {stanzaId: 'msg-1'}}},
                messageType: 'extendedTextMessage',
                messageTimestamp: 1_796_045_460,
            },
        };

        expect(parseEvolutionWebhook(body, now)).toEqual([
            {
                kind: 'reply',
                messageId: 'in-1',
                quotedMessageId: 'msg-1',
                senders: ['551187654321'],
                text: 'Confirmo',
                occurredAt: new Date(1_796_045_460_000),
            },
        ]);
    });

    it('should take the phone from the alternative JID when the sender uses a LID', () => {
        const body = {
            event: 'messages.upsert',
            data: {
                key: {id: 'in-1', remoteJid: '123456@lid', remoteJidAlt: '5511987654321@s.whatsapp.net', fromMe: false},
                message: {conversation: 'Sim'},
            },
        };

        expect(parseEvolutionWebhook(body, now)).toMatchObject([
            {kind: 'reply', senders: ['5511987654321'], text: 'Sim', quotedMessageId: null},
        ]);
    });

    it('should describe a message without text by its type', () => {
        const body = {
            event: 'messages.upsert',
            data: {
                key: {id: 'in-1', remoteJid: '5511987654321@s.whatsapp.net', fromMe: false},
                message: {audioMessage: {}},
                messageType: 'audioMessage',
            },
        };

        expect(parseEvolutionWebhook(body, now)).toMatchObject([{text: '[audioMessage]'}]);
    });

    it('should drop the clinic own messages, groups and unknown events', () => {
        const own = {
            event: 'messages.upsert',
            data: {
                key: {id: 'x', remoteJid: '5511987654321@s.whatsapp.net', fromMe: true},
                message: {conversation: 'Oi'},
            },
        };
        const group = {
            event: 'messages.upsert',
            data: {key: {id: 'x', remoteJid: '1203630@g.us', fromMe: false}, message: {conversation: 'Oi'}},
        };

        expect(parseEvolutionWebhook(own)).toEqual([]);
        expect(parseEvolutionWebhook(group)).toEqual([]);
        expect(parseEvolutionWebhook({event: 'connection.update', data: {state: 'open'}})).toEqual([]);
        expect(parseEvolutionWebhook('not json')).toEqual([]);
    });
});

describe('The WhatsApp number variants', () => {
    it('should add the form without the ninth digit for a Brazilian mobile', () => {
        expect(whatsAppNumberVariants('5511987654321')).toEqual(['5511987654321', '551187654321']);
    });

    it('should add the ninth digit to a 12-digit Brazilian number', () => {
        expect(whatsAppNumberVariants('551187654321')).toEqual(['551187654321', '5511987654321']);
    });

    it('should keep other numbers as they are', () => {
        expect(whatsAppNumberVariants('14155550100')).toEqual(['14155550100']);
    });
});
