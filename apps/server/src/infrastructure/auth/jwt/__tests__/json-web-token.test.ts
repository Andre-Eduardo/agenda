import type {JwtPayload} from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import {ZodError} from 'zod';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {UserId} from '@domain/user/entities';
import type {TokenData} from '@domain/user/token';
import {TokenScope} from '@domain/user/token';
import {JsonWebToken} from '../json-web-token';

describe('A JSON Web Token', () => {
    const clinicMemberId = ClinicMemberId.generate();
    const tokenData: TokenData = {
        userId: UserId.generate(),
        clinicMemberId,
        clinicMembers: [{clinicMemberId, clinicId: ClinicId.generate()}],
        issueTime: new Date(1000),
        expirationTime: new Date(2000),
        scope: [TokenScope.AUTH],
        metadata: {
            foo: 'bar',
        },
    };
    const secret = 'super-secret';

    const jwtPayload: JwtPayload = JsonWebToken.parseToJwtPayload(tokenData);

    it('should be signed', () => {
        const token = JsonWebToken.signed(tokenData, secret);

        expect(token.userId).toEqual(tokenData.userId);
        expect(token.issueTime).toEqual(tokenData.issueTime);
        expect(token.expirationTime).toEqual(tokenData.expirationTime);
        expect(token.scope).toEqual(tokenData.scope);
        expect(token.metadata).toEqual(tokenData.metadata);

        jwt.verify(token.toString(), secret, {
            clockTimestamp: tokenData.issueTime.getTime() / 1000,
        });

        expect(token.toString()).toEqual(
            expect.stringContaining(
                `${Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64url')}.` +
                    `${Buffer.from(JSON.stringify(jwtPayload)).toString('base64url')}.`
            )
        );
    });

    it('can be parsed to a JWT payload', () => {
        expect(jwtPayload).toEqual({
            exp: 2,
            iat: 1,
            nbf: 1,
            iss: JsonWebToken.ISSUER,
            aud: JsonWebToken.AUDIENCE,
            scope: tokenData.scope,
            sub: tokenData.userId.toString(),
            clinicMemberId: clinicMemberId.toString(),
            clinicMembers: tokenData.clinicMembers.map((member) => ({
                clinicMemberId: member.clinicMemberId.toString(),
                clinicId: member.clinicId.toString(),
            })),
            metadata: tokenData.metadata,
        });
    });

    it('can be parsed from an encoded token', () => {
        const token = JsonWebToken.signed(tokenData, secret);
        const parsedToken = JsonWebToken.parse(token.toString());

        expect(parsedToken.userId).toEqual(tokenData.userId);
        expect(parsedToken.clinicMemberId).toEqual(tokenData.clinicMemberId);
        expect(parsedToken.clinicMembers).toEqual(tokenData.clinicMembers);
        expect(parsedToken.issueTime).toEqual(tokenData.issueTime);
        expect(parsedToken.expirationTime).toEqual(tokenData.expirationTime);
        expect(parsedToken.scope).toEqual(tokenData.scope);
        expect(parsedToken.metadata).toEqual(tokenData.metadata);
    });

    it.each([
        {},
        {...jwtPayload, exp: -1},
        {...jwtPayload, iat: -1},
        {...jwtPayload, nbf: -1},
        {...jwtPayload, iss: 'unknown.com'},
        {...jwtPayload, aud: 'foo'},
        {...jwtPayload, scope: ['SCOPE']},
        {...jwtPayload, sub: '123'},
        {...jwtPayload, clinicMemberId: '123'},
        {...jwtPayload, clinicMembers: [{clinicMemberId: '123', clinicId: '456'}]},
        {...jwtPayload, metadata: 'bar'},
    ])('should fail to parse a token with invalid claims', (claims) => {
        const invalidToken = jwt.sign(claims, null, {algorithm: 'none'});

        expect(() => JsonWebToken.parse(invalidToken)).toThrow(ZodError);
    });

    it('can be serialized to JSON', () => {
        const token = JsonWebToken.signed(tokenData, secret);

        expect(token.toJSON()).toEqual(tokenData);
    });
});
