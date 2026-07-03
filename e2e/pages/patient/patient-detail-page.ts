import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class PatientDetailPage extends BasePage {
    readonly editButton: Locator;
    readonly newRecordAction: Locator;
    readonly patientInformationSection: Locator;
    readonly firstRecordRow: Locator;

    constructor(page: Page) {
        super(page);
        this.editButton = page.getByRole('button', {name: /editar cadastro/i});
        this.newRecordAction = page.getByRole('button', {name: /nova evolução/i});
        this.patientInformationSection = page.getByText(/informações do paciente/i);
        this.firstRecordRow = page.locator('[data-record-row]').first();
    }

    name(patientName: string): Locator {
        return this.page.getByText(patientName, {exact: true}).first();
    }

    async navigate(patientId: string) {
        await this.page.goto(`/patients/${patientId}`);
    }

    async verifyPageLoaded(patientName?: string) {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+$/);
        await expect(this.editButton).toBeVisible();
        if (patientName) {
            await expect(this.name(patientName)).toBeVisible();
        }
    }

    async goToEdit() {
        await this.editButton.click();
    }

    async goToNewRecord() {
        await this.newRecordAction.click();
    }

    async openFirstRecord() {
        await this.firstRecordRow.click();
    }
}
