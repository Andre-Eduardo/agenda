import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScrollArea } from "./index";

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[280px] rounded-md border p-3">
      <p className="text-sm">
        {Array.from({ length: 30 })
          .map((_, i) => `Linha ${i + 1}`)
          .join("\n")}
      </p>
    </ScrollArea>
  ),
};
