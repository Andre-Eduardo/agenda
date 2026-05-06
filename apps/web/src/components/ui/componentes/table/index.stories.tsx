import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./index";

const meta = {
  title: "UI/Table",
  component: Table,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  { id: "001", name: "Maria Silva", status: "Confirmada" },
  { id: "002", name: "João Souza", status: "Pendente" },
  { id: "003", name: "Ana Costa", status: "Cancelada" },
];

export const Default: Story = {
  render: () => (
    <div className="w-[480px]">
      <Table>
        <TableCaption>Lista de consultas recentes.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono tabular-nums">{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell className="text-right">{row.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
