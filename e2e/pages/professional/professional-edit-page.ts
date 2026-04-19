import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class ProfessionalEditPage extends BasePage {
    readonly title: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^editar:/i});
    }

    async navigate(professionalId: string) {
        await this.page.goto(`/professionals/${professionalId}/edit`);
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/professionals\/[^/]+\/edit$/);
        await expect(this.title).toBeVisible();
    }
}
