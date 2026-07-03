import type {Meta, StoryObj} from '@storybook/react-vite';
import {css} from '@/styled-system/css';
import {Input} from '../input';
import {Label} from './index';

const meta = {
    title: 'UI/Label',
    component: Label,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className={css({display: 'grid', w: '[280px]', alignItems: 'center', gap: '2'})}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
        </div>
    ),
};
