import {expect, type Locator} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class ReceptionPage extends BasePage {
    get title(): Locator {
        return this.page.getByRole('heading', {name: 'Recepção', exact: true});
    }

    appointment(patientName: string): Locator {
        return this.page.getByRole('article', {name: `Consulta de ${patientName}`});
    }

    async navigate(): Promise<void> {
        await this.page.goto('/reception');
    }

    async verifyPageLoaded(): Promise<void> {
        await expect(this.title).toBeVisible();
    }
}
