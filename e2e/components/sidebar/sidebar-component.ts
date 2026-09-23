import type {Locator, Page} from '@playwright/test';

export class SidebarComponent {
    readonly page: Page;
    readonly menuButton: Locator;
    readonly logoutButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.menuButton = page.getByRole('button', {name: /menu principal/i});
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
    }

    async logout() {
        await this.open();

        await this.logoutButton.click();
    }
}
