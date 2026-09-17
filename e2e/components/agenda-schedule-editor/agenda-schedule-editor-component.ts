import type {Locator, Page} from '@playwright/test';

/**
 * Wraps `AgendaScheduleEditor` (apps/web/src/views/components/AgendaScheduleEditor) — the
 * working-hours + member-block editor reused by both Settings ("Agenda" tab, self-service)
 * and the Team member detail page (managing another member's agenda).
 */
export class AgendaScheduleEditorComponent {
    readonly page: Page;
    readonly newBlockButton: Locator;
    readonly createBlockButton: Locator;
    readonly cancelBlockDialogButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.newBlockButton = page.getByRole('button', {name: /novo bloqueio/i});
        this.createBlockButton = page.getByRole('button', {name: /^criar bloqueio$/i});
        this.cancelBlockDialogButton = page
            .getByRole('dialog', {name: /novo bloqueio de agenda/i})
            .getByRole('button', {name: /^cancelar$/i});
    }

    /** The accessible group wrapping a single weekday row (toggle + hours + save button). */
    dayRow(dayLabel: string): Locator {
        return this.page.getByRole('group', {name: dayLabel});
    }

    async setDayActive(dayLabel: string, active: boolean) {
        const row = this.dayRow(dayLabel);
        await row.getByRole('radio', {name: active ? /^ativo$/i : /^inativo$/i}).click();
    }

    async fillDayHours(dayLabel: string, options: {startTime?: string; endTime?: string; slotDuration?: number}) {
        const row = this.dayRow(dayLabel);

        if (options.startTime) {
            await row.getByLabel('Início').fill(options.startTime);
        }

        if (options.endTime) {
            await row.getByLabel('Fim').fill(options.endTime);
        }

        if (options.slotDuration !== undefined) {
            await row.getByLabel(/duração do atendimento/i).fill(String(options.slotDuration));
        }
    }

    async saveDay(dayLabel: string) {
        await this.dayRow(dayLabel)
            .getByRole('button', {name: /^salvar$/i})
            .click();
    }

    async configureDay(
        dayLabel: string,
        options: {active: boolean; startTime?: string; endTime?: string; slotDuration?: number}
    ) {
        await this.setDayActive(dayLabel, options.active);

        if (options.active) {
            await this.fillDayHours(dayLabel, options);
        }

        await this.saveDay(dayLabel);
    }

    async createBlock(options: {start: string; end: string; reason?: string}) {
        await this.newBlockButton.click();

        const dialog = this.page.getByRole('dialog', {name: /novo bloqueio de agenda/i});
        await dialog.getByLabel('Início').fill(options.start);
        await dialog.getByLabel('Fim').fill(options.end);

        if (options.reason) {
            await dialog.getByLabel('Motivo').fill(options.reason);
        }

        await this.createBlockButton.click();
    }

    blockText(reason: string): Locator {
        return this.page.getByText(reason, {exact: true});
    }

    async deleteBlock(reason: string) {
        await this.page.getByRole('button', {name: new RegExp(`remover bloqueio: ${this.escapeRegExp(reason)}`, 'i')}).click();
    }

    private escapeRegExp(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
