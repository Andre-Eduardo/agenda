import type {Meta, StoryObj} from '@storybook/react-vite';
import {css} from '@/styled-system/css';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from './index';

const meta = {
    title: 'UI/Command',
    component: Command,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Command
            className={css({
                w: '[360px]',
                rounded: 'lg',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'border',
                boxShadow: 'md',
            })}
        >
            <CommandInput placeholder="Buscar..." />
            <CommandList>
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                <CommandGroup heading="Sugestões">
                    <CommandItem>Calendário</CommandItem>
                    <CommandItem>Pacientes</CommandItem>
                    <CommandItem>Prontuário</CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Ações">
                    <CommandItem>
                        Configurações
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </Command>
    ),
};
