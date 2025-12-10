import {Injectable} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type {UserId} from '../../../domain/user/entities';
import type {Token, TokenProvider, TokenOptions} from '../../../domain/user/token';
import {JsonWebToken} from './json-web-token';

@Injectable()
export class JsonWebTokenProvider implements TokenProvider<JsonWebToken> {
    constructor(
        private readonly expiration: number,
        private readonly secret: string | Buffer
    ) {}

    issue(userId: UserId, options?: TokenOptions): JsonWebToken {
        const now = new Date();

        return JsonWebToken.signed(
            {
                userId,
                professionalId: options?.professionalId ?? null,
                scope: options?.scope ?? [],
                issueTime: now,
                expirationTime: new Date(now.getTime() + (options?.expiration ?? this.expiration) * 1000),
                metadata: options?.metadata,
            },
            this.secret
        );
    }

    validate(token: Token): boolean {
        if (!(token instanceof JsonWebToken)) {
            return false;
        }

        try {
            jwt.verify(token.toString(), this.secret, {
                issuer: JsonWebToken.ISSUER,
                audience: JsonWebToken.AUDIENCE,
            });

            return true;
        } catch {
            return false;
        }
    }

    parse(raw: string): JsonWebToken {
        return JsonWebToken.parse(raw);
    }
}
