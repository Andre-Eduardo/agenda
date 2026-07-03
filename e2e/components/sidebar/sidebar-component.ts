import type {Locator, Page} from '@playwright/test';

export class SidebarComponent {
    readonly page: Page;
    readonly logoutButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.logoutButton = page.getByRole('button', {name: /^sair$/i});
    }

    async logout() {
        await this.logoutButton.click();
    }
}
