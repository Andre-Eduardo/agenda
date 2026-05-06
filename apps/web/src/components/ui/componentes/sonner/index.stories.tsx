import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";

import { Button } from "../button";
import { Toaster } from "./index";

const meta = {
  title: "UI/Toaster (Sonner)",
  component: Toaster,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => toast.success("Salvo com sucesso")}>Success</Button>
        <Button variant="outline" onClick={() => toast.info("Informação")}>
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning("Atenção a este aviso")}
        >
          Warning
        </Button>
        <Button variant="destructive" onClick={() => toast.error("Algo deu errado")}>
          Error
        </Button>
      </div>
      <Toaster />
    </>
  ),
};
