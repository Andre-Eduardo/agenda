import {z} from 'zod';

/** Status ack of a message the clinic sent. */
export type EvolutionStatusUpdate = {
    kind: 'status';
    /** WhatsApp message id: the `key.id` that `sendText` returned. */
    messageId: string;
    status: 'DELIVERED' | 'READ' | 'ERROR';
    occurredAt: Date;
};

/** A message the patient sent to the clinic number. */
export type EvolutionReply = {
    kind: 'reply';
    messageId: string;
    /** Id of the message the patient replied to (WhatsApp "reply" / quote), when there is one. */
    quotedMessageId: string | null;
    /** Sender phone numbers, digits only (a contact can show up under more than one JID). */
    senders: string[];
    text: string | null;
    occurredAt: Date;
};

export type EvolutionWebhookItem = EvolutionStatusUpdate | EvolutionReply;

const keySchema = z
    .object({
        id: z.string().optional(),
        remoteJid: z.string().optional(),
        remoteJidAlt: z.string().optional(),
        senderPn: z.string().optional(),
        participant: z.string().optional(),
        fromMe: z.boolean().optional(),
    })
    .passthrough();

const contextInfoSchema = z.object({stanzaId: z.string().nullish()}).passthrough();

const messageSchema = z
    .object({
        conversation: z.string().nullish(),
        extendedTextMessage: z
            .object({text: z.string().nullish(), contextInfo: contextInfoSchema.nullish()})
            .passthrough()
            .nullish(),
        buttonsResponseMessage: z.object({selectedDisplayText: z.string().nullish()}).passthrough().nullish(),
        listResponseMessage: z.object({title: z.string().nullish()}).passthrough().nullish(),
        imageMessage: z
            .object({caption: z.string().nullish(), contextInfo: contextInfoSchema.nullish()})
            .passthrough()
            .nullish(),
    })
    .passthrough();

const updateItemSchema = z
    .object({
        keyId: z.string().optional(),
        messageId: z.string().optional(),
        key: keySchema.optional(),
        fromMe: z.boolean().optional(),
        status: z.union([z.string(), z.number()]).optional(),
        update: z
            .object({status: z.union([z.string(), z.number()]).optional()})
            .passthrough()
            .optional(),
    })
    .passthrough();

const upsertItemSchema = z
    .object({
        key: keySchema,
        message: messageSchema.nullish(),
        messageType: z.string().optional(),
        messageTimestamp: z.union([z.number(), z.string()]).optional(),
        contextInfo: contextInfoSchema.nullish(),
    })
    .passthrough();

const envelopeSchema = z
    .object({
        event: z.string(),
        date_time: z.string().optional(),
        data: z.unknown(),
    })
    .passthrough();

// Baileys numeric acks (older Evolution payloads): 0 ERROR, 1 PENDING, 2 SERVER_ACK, 3 DELIVERY_ACK, 4 READ, 5 PLAYED.
const NUMERIC_STATUS = ['ERROR', 'PENDING', 'SERVER_ACK', 'DELIVERY_ACK', 'READ', 'PLAYED'];

const STATUS_MAP: Record<string, EvolutionStatusUpdate['status'] | undefined> = {
    DELIVERY_ACK: 'DELIVERED',
    READ: 'READ',
    PLAYED: 'READ',
    ERROR: 'ERROR',
};

/**
 * Reads the Evolution API v2 webhook body (`messages.update` and `messages.upsert`). Anything else —
 * other events, group chats, the clinic's own messages, server acks — is dropped. `data` may be a
 * single item or a list, depending on the Evolution version.
 */
export function parseEvolutionWebhook(body: unknown, now: Date = new Date()): EvolutionWebhookItem[] {
    const envelope = envelopeSchema.safeParse(body);

    if (!envelope.success) return [];

    const event = envelope.data.event.toLowerCase().replaceAll('_', '.');
    const occurredAt = parseDate(envelope.data.date_time) ?? now;
    const {data} = envelope.data;
    const items = Array.isArray(data) ? data : [data];

    if (event === 'messages.update') {
        return items.flatMap((item) => parseStatus(item, occurredAt));
    }

    if (event === 'messages.upsert') {
        return items.flatMap((item) => parseReply(item, occurredAt));
    }

    return [];
}

function parseStatus(item: unknown, occurredAt: Date): EvolutionStatusUpdate[] {
    const parsed = updateItemSchema.safeParse(item);

    if (!parsed.success) return [];

    const {data} = parsed;
    const fromMe = data.fromMe ?? data.key?.fromMe;

    // Acks of messages the patient sent are not about our reminders.
    if (fromMe === false) return [];

    const messageId = data.keyId ?? data.key?.id;
    const rawStatus = data.status ?? data.update?.status;
    const statusName = typeof rawStatus === 'number' ? NUMERIC_STATUS[rawStatus] : rawStatus?.toUpperCase();
    const status = statusName === undefined ? undefined : STATUS_MAP[statusName];

    if (messageId === undefined || status === undefined) return [];

    return [{kind: 'status', messageId, status, occurredAt}];
}

function parseReply(item: unknown, occurredAt: Date): EvolutionReply[] {
    const parsed = upsertItemSchema.safeParse(item);

    if (!parsed.success) return [];

    const {key, message, messageType, messageTimestamp, contextInfo} = parsed.data;

    if (key.fromMe !== false || key.id === undefined) return [];

    const senders = [key.remoteJid, key.remoteJidAlt, key.senderPn]
        .map((jid) => phoneOfJid(jid))
        .filter((digits): digits is string => digits !== null);

    if (senders.length === 0) return [];

    const quotedMessageId =
        message?.extendedTextMessage?.contextInfo?.stanzaId ??
        message?.imageMessage?.contextInfo?.stanzaId ??
        contextInfo?.stanzaId ??
        null;

    return [
        {
            kind: 'reply',
            messageId: key.id,
            quotedMessageId,
            senders: [...new Set(senders)],
            text: textOf(message, messageType),
            occurredAt: parseEpochSeconds(messageTimestamp) ?? occurredAt,
        },
    ];
}

function textOf(
    message: z.infer<typeof messageSchema> | null | undefined,
    messageType: string | undefined
): string | null {
    const text =
        message?.conversation ??
        message?.extendedTextMessage?.text ??
        message?.buttonsResponseMessage?.selectedDisplayText ??
        message?.listResponseMessage?.title ??
        message?.imageMessage?.caption ??
        null;

    if (text !== null && text.trim() !== '') return text;

    return messageType === undefined ? null : `[${messageType}]`;
}

/** `5511987654321@s.whatsapp.net` → `5511987654321`. Groups, broadcasts and LIDs carry no phone. */
function phoneOfJid(jid: string | undefined): string | null {
    if (jid === undefined) return null;

    const [user, server] = jid.split('@');

    if (server !== 's.whatsapp.net' || user === undefined) return null;

    const digits = user.split(':')[0]?.replaceAll(/\D/g, '') ?? '';

    return digits === '' ? null : digits;
}

function parseDate(value: string | undefined): Date | null {
    if (value === undefined) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function parseEpochSeconds(value: number | string | undefined): Date | null {
    if (value === undefined) return null;

    const seconds = Number(value);

    return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000) : null;
}

/**
 * Forms a Brazilian mobile number can take: WhatsApp often reports the JID without the ninth
 * digit (`55 11 87654321`) for numbers registered as `55 11 987654321`, and vice versa.
 */
export function whatsAppNumberVariants(digits: string): string[] {
    const variants = new Set([digits]);

    if (digits.startsWith('55')) {
        if (digits.length === 13 && digits[4] === '9') {
            variants.add(`${digits.slice(0, 4)}${digits.slice(5)}`);
        } else if (digits.length === 12) {
            variants.add(`${digits.slice(0, 4)}9${digits.slice(4)}`);
        }
    }

    return [...variants];
}
