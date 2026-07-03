import type {Meta, StoryObj} from '@storybook/react-vite';
import {css} from '@/styled-system/css';
import {Tabs, TabsContent, TabsList, TabsTrigger} from './index';

const meta = {
    title: 'UI/Tabs',
    component: Tabs,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Tabs defaultValue="account" className={css({w: '[360px]'})}>
            <TabsList>
                <TabsTrigger value="account">Conta</TabsTrigger>
                <TabsTrigger value="password">Senha</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className={css({fontSize: 'sm'})}>
                Configurações da conta.
            </TabsContent>
            <TabsContent value="password" className={css({fontSize: 'sm'})}>
                Alterar senha.
            </TabsContent>
        </Tabs>
    ),
};
