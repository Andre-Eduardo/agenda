import type {CookieOptions, Response} from 'express';
import {mock} from 'jest-mock-extended';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import type {Token} from '@domain/user/token';
import {ExpressContextActions} from '../express-context-actions';

describe('Express context actions', () => {
    const response = mock<Response>();
    const authCookie = 'authCookieName';
    const clinicMemberCookie = 'clinicMemberCookieName';
    const cookieOptions: CookieOptions = {
        domain: 'example.com',
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        signed: true,
    };

    const expressContextActions = new ExpressContextActions(response, authCookie, clinicMemberCookie, cookieOptions);

    it('should store the token in the cookies', () => {
        const token = {} as Token;

        expressContextActions.setToken(token);

        expect(response.cookie).toHaveBeenCalledWith(authCookie, token.toString(), {
            ...cookieOptions,
            expires: token.expirationTime,
        });

        expect(response.clearCookie).not.toHaveBeenCalled();
    });

    it('should clear the token from the cookies', () => {
        expressContextActions.setToken(null);

        expect(response.clearCookie).toHaveBeenCalledWith(authCookie, {
            ...cookieOptions,
            expires: undefined,
        });
    });

    it('should store the current clinic member in the cookies', () => {
        const clinicMemberId = ClinicMemberId.generate();

        expressContextActions.setClinicMember(clinicMemberId);

        expect(response.cookie).toHaveBeenCalledWith(clinicMemberCookie, clinicMemberId.toString(), {
            ...cookieOptions,
            maxAge: 7 * 24 * 3600 * 1000,
        });

        expect(response.clearCookie).not.toHaveBeenCalled();
    });

    it('should clear the current clinic member from the cookies', () => {
        expressContextActions.setClinicMember(null);

        expect(response.clearCookie).toHaveBeenCalledWith(clinicMemberCookie, {
            ...cookieOptions,
            maxAge: undefined,
        });
    });
});
