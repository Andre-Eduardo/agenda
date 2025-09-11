import type {CompanyId} from '../../company/entities';
import type {UserId} from '../entities';

export enum TokenScope {
    AUTH = 'AUTH',
    RECOVERY = 'RECOVERY',
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
}

export type TokenData = {
    readonly userId: UserId;
    readonly companies: CompanyId[];
    readonly issueTime: Date;
    readonly expirationTime: Date;
    readonly scope: readonly TokenScope[];
    readonly metadata?: Readonly<Record<string, string | number | boolean>>;
};

export abstract class Token implements TokenData {
    readonly userId: UserId;

    readonly companies: CompanyId[];

    readonly issueTime: Date;

    readonly expirationTime: Date;

    readonly scope: readonly TokenScope[];

    readonly metadata?: Readonly<Record<string, string | number | boolean>>;

    protected constructor(metadata: TokenData) {
        this.userId = metadata.userId;
        this.companies = metadata.companies;
        this.issueTime = metadata.issueTime;
        this.expirationTime = metadata.expirationTime;
        this.scope = metadata.scope;
        this.metadata = metadata.metadata;
    }

    toJSON(): TokenData {
        return {
            userId: this.userId,
            companies: this.companies,
            issueTime: this.issueTime,
            expirationTime: this.expirationTime,
            scope: this.scope,
            metadata: this.metadata,
        };
    }

    abstract toString(): string;
}

export type TokenOptions = {
    /**
     * The time in seconds that the token will be valid for.
     */
    expiration?: number;
    /**
     * The scopes that the token will have.
     */
    scope?: TokenScope[];
    /**
     * The companies that the token will have access to.
     */
    companies?: CompanyId[];
    /**
     * Additional metadata to include in the token.
     */
    metadata?: Record<string, string | number | boolean>;
};

export interface TokenProvider<T extends Token = Token> {
    issue(userId: UserId, options?: TokenOptions): Promise<T> | T;

    parse(raw: string): T;

    validate(token: Token): Promise<boolean> | boolean;
}

export abstract class TokenProvider {}
