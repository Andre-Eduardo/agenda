import express, {type NextFunction, type Request, type RequestHandler, type Response} from 'express';
import {type Token, type TokenProvider, TokenScope} from '@domain/user/token';

export const UPLOADS_ROUTE = '/uploads';

/**
 * Serves locally stored uploads (STORAGE_TYPE=local) only to signed-in users.
 *
 * Replaces the old public ServeStaticModule mount, where anyone holding a file URL could
 * download clinical files without a session. The check mirrors the AuthGuard: a signed auth
 * cookie carrying a valid token with the AUTH scope. Unauthenticated requests get a bare 401,
 * and directory listings, dotfiles and fall-through to other routes are disabled.
 */
export function createProtectedUploadsHandlers(
    rootPath: string,
    authCookie: string,
    tokenProvider: TokenProvider
): RequestHandler[] {
    const requireSession = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        const token = readToken(request, authCookie, tokenProvider);

        if (token !== null && token.scope.includes(TokenScope.AUTH) && (await tokenProvider.validate(token))) {
            // Clinical files must never be kept by shared caches.
            response.setHeader('Cache-Control', 'private, no-store');
            next();

            return;
        }

        response.status(401).json({title: 'Unauthorized', status: 401, detail: 'Sign in to access this file.'});
    };

    return [
        (request, response, next) => {
            requireSession(request, response, next).catch(next);
        },
        express.static(rootPath, {index: false, dotfiles: 'deny', fallthrough: false, redirect: false}),
    ];
}

function readToken(request: Request, authCookie: string, tokenProvider: TokenProvider): Token | null {
    const signedCookies: unknown = request.signedCookies;

    if (typeof signedCookies !== 'object' || signedCookies === null) return null;

    const raw: unknown = Reflect.get(signedCookies, authCookie);

    if (typeof raw !== 'string' || raw === '') return null;

    try {
        return tokenProvider.parse(raw);
    } catch {
        return null;
    }
}
