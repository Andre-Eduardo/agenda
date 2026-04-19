import crypto from 'node:crypto';
import type {Page} from '@playwright/test';

const API_BASE_URL = process.env.API_URL ?? 'http://localhost:3000';

export type LoginOptions = {
    username: string;
    password: string;
    professionalId?: string;
};

export async function login(page: Page, options: LoginOptions) {
    const url = `${API_BASE_URL.replace(/\/$/, '')}/api/v1/auth/sign-in`;

    const response = await page.request.post(url, {
        data: {
            username: options.username,
            password: options.password,
            ...(options.professionalId ? {professionalId: options.professionalId} : {}),
        },
    });

    if (!response.ok()) {
        throw new Error(`API login failed: ${response.status()} ${await response.text()}`);
    }

    await page.addInitScript(() => {
        try {
            window.localStorage.setItem(
                'app-storage',
                JSON.stringify({
                    state: {colorMode: 'light', auth: true, sidebarCollapsed: false},
                    version: 0,
                })
            );
        } catch {
            // noop — localStorage may be blocked on about:blank
        }
    });
}

const SCRYPT_KEY_SIZE = 64;
const SCRYPT_SALT_SIZE = 16;

export function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SCRYPT_SALT_SIZE);
        crypto.scrypt(password, salt, SCRYPT_KEY_SIZE, (err, derivedKey) =>
            err !== null
                ? reject(err)
                : resolve(
                      `${SCRYPT_KEY_SIZE}:${salt.toString('base64')}:${derivedKey.toString('base64')}`
                  )
        );
    });
}
