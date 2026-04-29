import { Param } from "@nestjs/common";
import { z } from "zod";
import { ValidatedParam, ZodValidationPipe } from "../index";

jest.mock("@nestjs/common", () => ({
  Param: jest.fn(),
  Injectable: jest.fn(),
}));

describe("A Zod validated param", () => {
  it("should be decorated with a Zod schema", () => {
    const property = "test";
    const schema = z.number();

    ValidatedParam(property, schema);

    expect(Param).toHaveBeenCalledTimes(1);
    expect(Param).toHaveBeenCalledWith(property, new ZodValidationPipe(schema));
  });
});
