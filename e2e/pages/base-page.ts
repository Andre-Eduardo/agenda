import {
    expect,
    type Locator,
    type Page,
    type PageAssertionsToHaveScreenshotOptions,
} from '@playwright/test';

export abstract class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async verifyRequiredErrorMessage(locator: Locator) {
        await this.verifyErrorMessage(locator, /required|obrigat/i);
    }

    async verifyErrorMessage(locator: Locator, errorMessage: string | RegExp) {
        await expect(locator).toHaveAccessibleErrorMessage(errorMessage, {
            ignoreCase: true,
        });
    }

    async verifyNotification(message: string | RegExp) {
        await expect(
            this.page
                .getByRole('alert', {
                    name: typeof message === 'string' ? new RegExp(message, 'i') : message,
                })
                .first()
        ).toBeVisible();
    }

    async closeNotification() {
        await this.page
            .getByRole('alert')
            .first()
            .getByRole('button', {name: /close|fechar/i})
            .click();
    }

    async compareScreenshot(name: string, options?: PageAssertionsToHaveScreenshotOptions) {
        await this.page.mouse.wheel(0, -10000);
        await this.page.mouse.move(0, 0);
        await expect(this.page).toHaveScreenshot(`${name}.png`, {
            fullPage: true,
            maxDiffPixels: 100,
            threshold: 0.2,
            animations: 'disabled',
            ...options,
        });
    }

    verifyUrlParams(params: Record<string, string | number | boolean | string[]>) {
        const url = new URL(this.page.url());

        for (const [key, value] of Object.entries(params)) {
            if (Array.isArray(value)) {
                const urlValues = url.searchParams.getAll(key);
                expect(urlValues.sort()).toEqual(value.sort());
            } else {
                expect(url.searchParams.get(key)).toBe(String(value));
            }
        }
    }

    async verifyPath(expectedPath: string | RegExp) {
        if (typeof expectedPath === 'string') {
            await expect(this.page).toHaveURL(new RegExp(this.escapeRegExp(expectedPath) + '($|\\?|#)'));
        } else {
            await expect(this.page).toHaveURL(expectedPath);
        }
    }

    protected escapeRegExp(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    abstract navigate(...args: unknown[]): Promise<void>;
    abstract verifyPageLoaded(...args: unknown[]): Promise<void>;
}
