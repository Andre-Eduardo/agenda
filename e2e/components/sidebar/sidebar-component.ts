import {expect, type Locator, type Page} from '@playwright/test';

export class SidebarComponent {
    readonly page: Page;
    readonly menuButton: Locator;
    readonly menuSheet: Locator;
    readonly logoutButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.menuButton = page.getByRole('button', {name: /menu principal/i});
        this.menuSheet = page.getByRole('dialog', {name: /menu principal/i});
        this.logoutButton = page.getByRole('button', {name: /^sair$/i});
    }

    link(name: string | RegExp): Locator {
        return this.page.getByRole('link', {name, exact: true});
    }

    /** On mobile/tablet the sidebar lives in a Sheet behind the hamburger menu. */
    async open() {
        if (await this.menuButton.isVisible()) {
            await this.menuButton.click();
        }
    }

    async navigateTo(name: string | RegExp) {
        await this.open();

        await this.link(name).click();

        // The sheet closes with an exit animation. Until it is gone the hamburger button is
        // aria-hidden, so a following open() would skip it and click a link that is detaching.
        // On desktop there is no sheet, so this passes immediately.
        await expect(this.menuSheet).toBeHidden();
    }

    async logout() {
        await this.open();

        await this.logoutButton.click();
    }
}
