import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class TeamListPage extends BasePage {
    readonly title: Locator;
    readonly addMemberButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^equipe$/i});
        this.addMemberButton = page.getByRole('button', {name: /adicionar membro/i});
    }

    async navigate() {
        await this.page.goto('/team');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/team$/);
        await expect(this.title).toBeVisible();
    }

    row(memberDisplayName: string): Locator {
        return this.page.getByRole('row', {name: new RegExp(this.escapeRegExp(memberDisplayName))});
    }

    async openMember(memberDisplayName: string) {
        await this.row(memberDisplayName)
            .getByRole('link', {name: /ver detalhes do membro/i})
            .click();
    }
}
