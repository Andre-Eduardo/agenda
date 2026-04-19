import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class ProfessionalNewPage extends BasePage {
    readonly title: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^novo profissional$/i});
    }

    async navigate() {
        await this.page.goto('/professionals/new');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/professionals\/new$/);
        await expect(this.title).toBeVisible();
    }
}
