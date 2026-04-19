import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class ProfessionalListPage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly newProfessionalButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^profissionais$/i});
        this.subtitle = page.getByText(/cadastro de profissionais/i);
        this.newProfessionalButton = page.getByRole('button', {name: /novo profissional/i});
    }

    async navigate() {
        await this.page.goto('/professionals');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/professionals$/);
        await expect(this.title).toBeVisible();
        await expect(this.newProfessionalButton).toBeVisible();
    }
}
