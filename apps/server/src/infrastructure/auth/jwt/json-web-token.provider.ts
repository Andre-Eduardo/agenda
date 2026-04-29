import { Injectable } from "@nestjs/common";

// Step 202 showed import * as jwt from 'jsonwebtoken'.
// Step 205 showed update to use @nestjs/jwt JwtService?
// The error in Step 226 "Cannot find module '@nestjs/jwt'" suggests I introduced a dependency that might not be there or configured.
// I should stick to original design if possible, or ensure @nestjs/jwt is okay.
// Package.json (step 135) DOES NOT list @nestjs/jwt. It has `jsonwebtoken`.
// So I should use `jsonwebtoken`.

import * as jwt from "jsonwebtoken";
import { UserId } from "@domain/user/entities";
import { TokenOptions, TokenProvider } from "@domain/user/token";
import { JsonWebToken } from "@infrastructure/auth/jwt/json-web-token";

@Injectable()
export class JsonWebTokenProvider implements TokenProvider<JsonWebToken> {
  constructor(
    private readonly expiration: number,
    private readonly secret: string | Buffer,
  ) {}

  issue(userId: UserId, options: TokenOptions = {}): JsonWebToken {
    const now = new Date();

    return JsonWebToken.signed(
      {
        userId,
        clinicMemberId: options.clinicMemberId ?? null,
        clinicMembers: options.clinicMembers ?? [],
        scope: options.scope ?? [],
        issueTime: now,
        expirationTime: new Date(now.getTime() + (options.expiration ?? this.expiration) * 1000),
        metadata: options.metadata,
      },
      this.secret,
    );
  }

  validate(token: JsonWebToken): boolean {
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
