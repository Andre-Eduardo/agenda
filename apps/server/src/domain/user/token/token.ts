import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { UserId } from "@domain/user/entities";

export enum TokenScope {
  AUTH = "AUTH",
  RECOVERY = "RECOVERY",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
}

/**
 * Membro autorizado pelo token — uma entry por ClinicMember acessível ao User.
 * O ClinicMember atualmente "ativo" no contexto da request é selecionado pelo
 * cookie `current.company` (que armazena o clinicMemberId).
 */
export type TokenClinicMember = {
  clinicMemberId: ClinicMemberId;
  clinicId: ClinicId;
};

export type TokenData = {
  readonly userId: UserId;
  /** Lista de membros clínicos a que o User tem acesso. */
  readonly clinicMembers: TokenClinicMember[];
  /** Membro selecionado para a request atual (via cookie); null para tokens sem contexto. */
  readonly clinicMemberId: ClinicMemberId | null;
  readonly issueTime: Date;
  readonly expirationTime: Date;
  readonly scope: readonly TokenScope[];
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
};

export abstract class Token implements TokenData {
  readonly userId: UserId;

  readonly clinicMembers: TokenClinicMember[];

  readonly clinicMemberId: ClinicMemberId | null;

  readonly issueTime: Date;

  readonly expirationTime: Date;

  readonly scope: readonly TokenScope[];

  readonly metadata?: Readonly<Record<string, string | number | boolean>>;

  protected constructor(metadata: TokenData) {
    this.userId = metadata.userId;
    this.clinicMembers = metadata.clinicMembers;
    this.clinicMemberId = metadata.clinicMemberId;
    this.issueTime = metadata.issueTime;
    this.expirationTime = metadata.expirationTime;
    this.scope = metadata.scope;
    this.metadata = metadata.metadata;
  }

  toJSON(): TokenData {
    return {
      userId: this.userId,
      clinicMembers: this.clinicMembers,
      clinicMemberId: this.clinicMemberId,
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
   * The clinic member that the token is currently scoped to (via cookie).
   */
  clinicMemberId?: ClinicMemberId;
  /**
   * The clinic members that the token has access to.
   */
  clinicMembers?: TokenClinicMember[];
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
