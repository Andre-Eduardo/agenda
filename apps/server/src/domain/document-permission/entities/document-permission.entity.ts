import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import type {ClinicMemberId} from '../../clinic-member/entities';
import {
    DocumentPermissionGrantedEvent,
    DocumentPermissionChangedEvent,
} from '../events';
import {DocumentEntityType} from './document-entity-type';

export type DocumentPermissionProps = EntityProps<DocumentPermission>;
export type CreateDocumentPermission = CreateEntity<DocumentPermission>;
export type UpdateDocumentPermission = Partial<DocumentPermissionProps>;

/**
 * Permissão granular por documento. Sobrescreve ClinicPatientAccess.
 *
 * Quando NÃO existe registro para (membro, documento), o acesso herda de
 * ClinicPatientAccess. Quando existe, prevalece o que está aqui.
 */
export class DocumentPermission extends AggregateRoot<DocumentPermissionId> {
    clinicId: ClinicId;
    memberId: ClinicMemberId;
    entityType: DocumentEntityType;
    entityId: string;
    canView: boolean;
    /** Quem concedeu/revogou (auditoria de mudanças de permissão) */
    grantedByMemberId: ClinicMemberId | null;
    reason: string | null;

    constructor(props: AllEntityProps<DocumentPermission>) {
        super(props);
        this.clinicId = props.clinicId;
        this.memberId = props.memberId;
        this.entityType = props.entityType;
        this.entityId = props.entityId;
        this.canView = props.canView;
        this.grantedByMemberId = props.grantedByMemberId ?? null;
        this.reason = props.reason ?? null;
    }

    static create(props: CreateDocumentPermission): DocumentPermission {
        const now = new Date();

        const permission = new DocumentPermission({
            ...props,
            id: DocumentPermissionId.generate(),
            clinicId: props.clinicId,
            memberId: props.memberId,
            entityType: props.entityType,
            entityId: props.entityId,
            canView: props.canView,
            grantedByMemberId: props.grantedByMemberId ?? null,
            reason: props.reason ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        permission.addEvent(new DocumentPermissionGrantedEvent({permission, timestamp: now}));

        return permission;
    }

    change(props: UpdateDocumentPermission): void {
        const oldState = new DocumentPermission(this);

        if (props.canView !== undefined) {
            this.canView = props.canView;
        }

        if (props.grantedByMemberId !== undefined) {
            this.grantedByMemberId = props.grantedByMemberId;
        }

        if (props.reason !== undefined) {
            this.reason = props.reason;
        }

        this.addEvent(new DocumentPermissionChangedEvent({oldState, newState: this}));
    }

    toJSON(): EntityJson<DocumentPermission> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            memberId: this.memberId.toJSON(),
            entityType: this.entityType,
            entityId: this.entityId,
            canView: this.canView,
            grantedByMemberId: this.grantedByMemberId?.toJSON() ?? null,
            reason: this.reason,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class DocumentPermissionId extends EntityId<'DocumentPermissionId'> {
    static from(value: string): DocumentPermissionId {
        return new DocumentPermissionId(value);
    }

    static generate(): DocumentPermissionId {
        return new DocumentPermissionId();
    }
}
