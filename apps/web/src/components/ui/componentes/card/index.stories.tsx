import type {Meta, StoryObj} from '@storybook/react-vite';
import {css} from '@/styled-system/css';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from './index';

const meta = {
    title: 'UI/Card',
    component: Card,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Card className={css({w: '[320px]'})}>
            <CardHeader>
                <CardTitle>Título do card</CardTitle>
                <CardDescription>Descrição curta do conteúdo.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className={css({fontSize: 'sm'})}>Conteúdo principal do card.</p>
            </CardContent>
            <CardFooter>
                <p className={css({fontSize: 'xs', color: 'text.secondary'})}>Rodapé</p>
            </CardFooter>
        </Card>
    ),
};
