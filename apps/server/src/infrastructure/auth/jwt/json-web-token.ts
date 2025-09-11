import type {JwtPayload} from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {UserId} from '../../../domain/user/entities';
import type {TokenData} from '../../../domain/user/token';
import {Token, TokenScope} from '../../../domain/user/token';

type JsonWebTokenOptions = {
    data: TokenData;
    encodedToken: string;
};

/**
 * A signed token designed to be used on the Web.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7519.html
 */
export class JsonWebToken extends Token {
    static ISSUER = 'ecxus.com.br';

    static AUDIENCE = 'ecxus.com.br:automo';

    private static CLAIM_VALIDATION = z
        .object({
            exp: z.number().nonnegative().int(),
            iat: z.number().nonnegative().int(),
            nbf: z.number().nonnegative().int(),
            iss: z.literal(this.ISSUER),
            aud: z.literal(this.AUDIENCE),
            scope: z.array(z.nativeEnum(TokenScope)),
            sub: z.string().uuid(),
            companies: z.array(z.string().uuid()),
            metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
        })
        .strict();

    private readonly encodedToken: string;

    constructor(options: JsonWebTokenOptions) {
        const {issueTime, expirationTime} = options.data;

        super({
            ...options.data,
            // Ensure that the milliseconds are zeroed out to avoid precision issues since JWTs claims are in seconds.
            issueTime: new Date(issueTime.getTime() - (issueTime.getTime() % 1000)),
            expirationTime: new Date(expirationTime.getTime() - (expirationTime.getTime() % 1000)),
        });
        this.encodedToken = options.encodedToken;
    }

    static signed(data: TokenData, secret: string | Buffer): JsonWebToken {
        return new JsonWebToken({
            data,
            encodedToken: jwt.sign(JsonWebToken.parseToJwtPayload(data), secret),
        });
    }

    static parse(raw: string): JsonWebToken {
        const payload = this.CLAIM_VALIDATION.parse(jwt.decode(raw));

        const data: TokenData = {
            expirationTime: new Date(payload.exp * 1000),
            issueTime: new Date(payload.iat * 1000),
            userId: UserId.from(payload.sub),
            companies: payload.companies.map((id) => CompanyId.from(id)),
            scope: payload.scope,
            metadata: payload.metadata,
        };

        return new JsonWebToken({
            data,
            encodedToken: raw,
        });
    }

    /**
     * Parses token data encoded as a JWT payload.
     */
    static parseToJwtPayload(data: TokenData): JwtPayload {
        return {
            exp: Math.trunc(data.expirationTime.getTime() / 1000),
            iat: Math.trunc(data.issueTime.getTime() / 1000),
            nbf: Math.trunc(data.issueTime.getTime() / 1000),
            iss: JsonWebToken.ISSUER,
            aud: JsonWebToken.AUDIENCE,
            scope: [...data.scope],
            sub: data.userId.toString(),
            companies: data.companies.map((id) => id.toString()),
            metadata: data.metadata,
        } satisfies z.infer<typeof this.CLAIM_VALIDATION>;
    }

    toString(): string {
        return this.encodedToken;
    }
}
