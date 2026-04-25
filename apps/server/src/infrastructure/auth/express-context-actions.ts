import type {CookieOptions, Response} from 'express';
import type {ClinicMemberId} from '../../domain/clinic-member/entities';
import type {Token} from '../../domain/user/token';

export class ExpressContextActions {
    public constructor(
        private readonly response: Response,
        private readonly authCookie: string,
        private readonly clinicMemberCookie: string,
        private readonly cookieOptions: CookieOptions
    ) {}

    public setToken(token: Token | null): void {
        const cookieOptions: CookieOptions = {
            ...this.cookieOptions,
            expires: token?.expirationTime,
        };

        if (token === null) {
            this.response.clearCookie(this.authCookie, cookieOptions);

            return;
        }

        this.response.cookie(this.authCookie, token.toString(), cookieOptions);
    }

    public setClinicMember(clinicMemberId: ClinicMemberId | null): void {
        const cookieOptions: CookieOptions = {
            ...this.cookieOptions,
            maxAge: clinicMemberId === null ? undefined : 7 * 24 * 3600 * 1000, // 1 week
        };

        if (clinicMemberId === null) {
            this.response.clearCookie(this.clinicMemberCookie, cookieOptions);

            return;
        }

        this.response.cookie(this.clinicMemberCookie, clinicMemberId.toString(), cookieOptions);
    }
}
