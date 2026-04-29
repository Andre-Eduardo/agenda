import { PrismaService } from "../index";

describe("A prisma service", () => {
  describe("onModuleInit", () => {
    it("should call $connect", async () => {
      const prismaService = new PrismaService();

      jest.spyOn(prismaService, "$connect").mockImplementation(async () => {});

      await prismaService.onModuleInit();

      expect(prismaService.$connect).toHaveBeenCalled();
    });
  });
});
