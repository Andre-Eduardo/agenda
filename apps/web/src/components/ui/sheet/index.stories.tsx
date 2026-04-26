import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./index";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Título</SheetTitle>
          <SheetDescription>Conteúdo lateral.</SheetDescription>
        </SheetHeader>
        <div className="py-4 text-sm">Corpo do sheet.</div>
        <SheetFooter>
          <Button>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};
