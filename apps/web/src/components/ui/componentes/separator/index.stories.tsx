import type {Meta, StoryObj} from '@storybook/react-vite';
import {css} from '@/styled-system/css';
import {Separator} from './index';

const meta = {
    title: 'UI/Separator',
    component: Separator,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
    render: () => (
        <div className={css({w: '[280px]'})}>
            <p className={css({fontSize: 'sm'})}>Acima</p>
            <Separator className={css({my: '3'})} />
            <p className={css({fontSize: 'sm'})}>Abaixo</p>
        </div>
    ),
};

export const Vertical: Story = {
    render: () => (
        <div className={css({display: 'flex', h: '10', alignItems: 'center', gap: '3'})}>
            <span className={css({fontSize: 'sm'})}>Item A</span>
            <Separator orientation="vertical" />
            <span className={css({fontSize: 'sm'})}>Item B</span>
        </div>
    ),
};
