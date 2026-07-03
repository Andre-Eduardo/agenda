import type {Meta, StoryObj} from '@storybook/react-vite';
import {css} from '@/styled-system/css';
import {Skeleton} from './index';

const meta = {
    title: 'UI/Skeleton',
    component: Skeleton,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className={css({display: 'flex', w: '[280px]', alignItems: 'center', gap: '3'})}>
            <Skeleton className={css({h: '12', w: '12', rounded: 'full'})} />
            <div className={css({display: 'flex', flexDirection: 'column', gap: '2'})}>
                <Skeleton className={css({h: '4', w: '[180px]'})} />
                <Skeleton className={css({h: '4', w: '[120px]'})} />
            </div>
        </div>
    ),
};
