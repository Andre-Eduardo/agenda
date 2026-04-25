import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {ClinicalDocument} from '../entities';

export class ClinicalDocumentGeneratedEvent extends DomainEvent {
    static readonly type = 'CLINICAL_DOCUMENT_GENERATED';
    readonly document: ClinicalDocument;

    constructor(props: DomainEventProps<ClinicalDocumentGeneratedEvent>) {
        super(ClinicalDocumentGeneratedEvent.type, props.timestamp);
        this.document = props.document;
    }
}
