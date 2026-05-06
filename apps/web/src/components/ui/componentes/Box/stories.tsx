import type {Meta, StoryObj} from '@storybook/react';
import {Box} from '.';

const meta = {
    title: 'Layout/Box',
    component: Box,
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    argTypes: {
        as: {
            control: 'text',
        },
    },
    args: {
        style: {
            backgroundColor: '#FFFFFF',
            border: '.8px solid #868686',
            width: 16,
            height: 16,
        },
    },
};
