import type {CookieOptions, Response} from 'express';
import type {CompanyId} from '../../domain/company/entities';
import type {Token} from '../../domain/user/token';

export class ExpressContextActions {
    public constructor(
        private readonly response: Response,
        private readonly authCookie: string,
        private readonly companyCookie: string,
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

    public setCompany(companyId: CompanyId | null): void {
        const cookieOptions: CookieOptions = {
            ...this.cookieOptions,
            maxAge: companyId === null ? undefined : 7 * 24 * 3600 * 1000, // 1 week
        };

        if (companyId === null) {
            this.response.clearCookie(this.companyCookie, cookieOptions);

            return;
        }

        this.response.cookie(this.companyCookie, companyId.toString(), cookieOptions);
    }
}
