import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class PatientFormFillPage extends BasePage {
    readonly completeButton: Locator;
    readonly backButton: Locator;

    constructor(page: Page) {
        super(page);
        this.completeButton = page.getByRole('button', {name: /concluir formulário/i});
        this.backButton = page.getByRole('button', {name: /voltar/i});
    }

    async navigate(patientId: string, patientFormId: string) {
        await this.page.goto(`/patients/${patientId}/forms/${patientFormId}`);
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+\/forms\/[^/]+$/);
        await expect(this.backButton).toBeVisible();
    }
}
