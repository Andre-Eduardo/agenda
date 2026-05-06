import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "./index";

const meta = {
  title: "UI/Popover",
  component: Popover,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Abrir popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px]">
        <p className="text-sm">Conteúdo do popover.</p>
      </PopoverContent>
    </Popover>
  ),
};
