import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class TeamDetailPage extends BasePage {
    readonly agendaAccessSelect: Locator;
    readonly grantAccessButton: Locator;

    constructor(page: Page) {
        super(page);
        this.agendaAccessSelect = page.getByRole('combobox', {name: /selecionar membro/i});
        this.grantAccessButton = page.getByRole('button', {name: /conceder acesso/i});
    }

    async navigate(memberId: string) {
        await this.page.goto(`/team/${memberId}`);
    }

    async verifyPageLoaded() {
        await expect(this.grantAccessButton).toBeVisible();
    }

    async grantAccessTo(memberDisplayName: string) {
        await this.agendaAccessSelect.click();
        await this.page.getByRole('option', {name: memberDisplayName}).click();
        await this.grantAccessButton.click();
    }

    granteeRow(memberDisplayName: string): Locator {
        return this.page.getByRole('group', {name: memberDisplayName});
    }

    async revokeAccessFrom(memberDisplayName: string) {
        await this.granteeRow(memberDisplayName)
            .getByRole('button', {name: /revogar acesso/i})
            .click();
    }
}
