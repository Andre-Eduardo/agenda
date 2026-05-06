import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";

import { Button } from "../button";
import { Input } from "../input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./index";

type FormValues = { username: string };

function FormDemo() {
  const form = useForm<FormValues>({ defaultValues: { username: "" } });

  return (
    <Form {...form}>
      <form
        className="w-[320px] space-y-4"
        onSubmit={form.handleSubmit((values) => {
          // eslint-disable-next-line no-console
          console.log("submit", values);
        })}
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuário</FormLabel>
              <FormControl>
                <Input placeholder="seu_usuario" {...field} />
              </FormControl>
              <FormDescription>Como você será exibido no sistema.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </Form>
  );
}

const meta = {
  title: "UI/Form",
  component: FormDemo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof FormDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
