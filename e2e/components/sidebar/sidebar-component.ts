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

    /** On mobile/tablet the sidebar lives in a Sheet behind the hamburger menu. */
    async logout() {
        if (await this.menuButton.isVisible()) {
            await this.menuButton.click();
        }

        await this.logoutButton.click();
    }
}
