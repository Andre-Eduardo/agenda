import {parseSesEvent} from '../ses-event.parser';

describe('The SES event parser', () => {
    const now = new Date('2026-11-30T13:30:00Z');
    const mail = {messageId: 'ses-1', timestamp: '2026-11-30T13:00:00.000Z'};

    it('should read a delivery', () => {
        const message = JSON.stringify({
            eventType: 'Delivery',
            mail,
            delivery: {timestamp: '2026-11-30T13:00:05.000Z'},
        });

        expect(parseSesEvent(message, now)).toEqual({
            sesMessageId: 'ses-1',
            type: 'DELIVERED',
            occurredAt: new Date('2026-11-30T13:00:05.000Z'),
            detail: null,
        });
    });

    it('should read identity notifications too', () => {
        const message = JSON.stringify({notificationType: 'Delivery', mail, delivery: {}});

        expect(parseSesEvent(message, now)).toMatchObject({type: 'DELIVERED', occurredAt: new Date(mail.timestamp)});
    });

    it('should describe a bounce', () => {
        const message = JSON.stringify({
            eventType: 'Bounce',
            mail,
            bounce: {
                bounceType: 'Permanent',
                bounceSubType: 'NoEmail',
                timestamp: '2026-11-30T13:00:05.000Z',
                bouncedRecipients: [{emailAddress: 'x@example.com', diagnosticCode: 'smtp; 550 5.1.1 user unknown'}],
            },
        });

        expect(parseSesEvent(message, now)).toMatchObject({
            type: 'DELIVERY_FAILED',
            detail: 'Bounce Permanent/NoEmail: smtp; 550 5.1.1 user unknown',
        });
    });

    it.each([
        [{eventType: 'Open', open: {timestamp: '2026-11-30T14:00:00.000Z'}}, 'READ'],
        [{eventType: 'Complaint', complaint: {complaintFeedbackType: 'abuse'}}, 'COMPLAINED'],
        [{eventType: 'Reject', reject: {reason: 'Bad content'}}, 'DELIVERY_FAILED'],
        [{eventType: 'Rendering Failure', failure: {errorMessage: 'missing'}}, 'DELIVERY_FAILED'],
    ])('should map %j to %s', (event, type) => {
        expect(parseSesEvent(JSON.stringify({...event, mail}), now)).toMatchObject({type});
    });

    it('should ignore events that do not change the timeline and invalid messages', () => {
        expect(parseSesEvent(JSON.stringify({eventType: 'Send', mail}), now)).toBeNull();
        expect(parseSesEvent(JSON.stringify({eventType: 'Click', mail}), now)).toBeNull();
        expect(parseSesEvent('not json', now)).toBeNull();
        expect(parseSesEvent(JSON.stringify({eventType: 'Delivery'}), now)).toBeNull();
    });
});
