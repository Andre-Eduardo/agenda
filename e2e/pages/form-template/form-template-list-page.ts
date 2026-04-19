import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class FormTemplateListPage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly searchInput: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /templates de formulário/i});
        this.subtitle = page.getByText(/modelos clínicos dinâmicos/i);
        this.searchInput = page.getByPlaceholder(/buscar template/i);
    }

    async navigate() {
        await this.page.goto('/form-templates');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/form-templates$/);
        await expect(this.title).toBeVisible();
        await expect(this.searchInput).toBeVisible();
    }
}
