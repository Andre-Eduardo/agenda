import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class AppointmentListPage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly newAppointmentButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^consultas$/i});
        this.subtitle = page.getByText(/agenda médica/i);
        this.newAppointmentButton = page.getByRole('button', {name: /nova consulta/i});
    }

    async navigate() {
        await this.page.goto('/appointments');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/appointments$/);
        await expect(this.title).toBeVisible();
        await expect(this.newAppointmentButton).toBeVisible();
    }
}
