import type {Meta, StoryObj} from '@storybook/react-vite';
import {css} from '@/styled-system/css';
import {Input} from './index';

const meta = {
    title: 'UI/Input',
    component: Input,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
    args: {placeholder: 'Digite aqui...'},
    decorators: [
        (Story) => (
            <div className={css({w: '[280px]'})}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Email: Story = {args: {type: 'email', placeholder: 'you@example.com'}};
export const Disabled: Story = {args: {disabled: true, value: 'Desabilitado'}};
