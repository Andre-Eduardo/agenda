import type {Meta, StoryObj} from '@storybook/react-vite';
import {css} from '@/styled-system/css';
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from './index';

const meta = {
    title: 'UI/Table',
    component: Table,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
    {id: '001', name: 'Maria Silva', status: 'Confirmada'},
    {id: '002', name: 'João Souza', status: 'Pendente'},
    {id: '003', name: 'Ana Costa', status: 'Cancelada'},
];

export const Default: Story = {
    render: () => (
        <div className={css({w: '[480px]'})}>
            <Table>
                <TableCaption>Lista de consultas recentes.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className={css({w: '[80px]'})}>ID</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead className={css({textAlign: 'right'})}>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell className={css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums'})}>
                                {row.id}
                            </TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell className={css({textAlign: 'right'})}>{row.status}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    ),
};
