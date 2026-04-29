import process from "process";
import { ConfigService } from "@nestjs/config";
import type { EnvConfig } from "../index";
import { EnvConfigService } from "../index";

describe("An environment configuration service", () => {
  it("should get the env", () => {
    const configService = new ConfigService({
      env: "development",
    });

    const envConfigService = new EnvConfigService(configService);

    expect(envConfigService.env).toBe("development");
  });

  it("should get the port", () => {
    const configService = new ConfigService({
      port: 3000,
    });

    const envConfigService = new EnvConfigService(configService);

    expect(envConfigService.port).toBe(3000);
  });

  it("should get the cookie secret", () => {
    const configService = new ConfigService({
      cookieSecret: "cookie-secret",
    });

    const envConfigService = new EnvConfigService(configService);

    expect(envConfigService.cookieSecret).toBe("cookie-secret");
  });

  it("should get the auth configuration", () => {
    const authConfig: Partial<EnvConfig> = {
      auth: {
        cookieName: "session.token",
        token: {
          expiration: 24 * 3600,
          secret: "super-secret",
        },
      },
    };

    const configService = new ConfigService(authConfig);

    const envConfigService = new EnvConfigService(configService);

    expect(envConfigService.auth).toBe(authConfig.auth);
  });

  it("should get the company configuration", () => {
    const companyConfig: Partial<EnvConfig> = {
      company: {
        cookieName: "current.company",
      },
    };

    const configService = new ConfigService(companyConfig);

    const envConfigService = new EnvConfigService(configService);

    expect(envConfigService.company).toBe(companyConfig.company);
  });

  it("should check if the environment is production", () => {
    const configService = new ConfigService({
      env: "production",
    });

    const envConfigService = new EnvConfigService(configService);

    expect(envConfigService.isProd).toBe(true);
    expect(envConfigService.isDev).toBe(false);
  });

  it("should check if the environment is development", () => {
    const configService = new ConfigService({
      env: "development",
    });

    const envConfigService = new EnvConfigService(configService);

    expect(envConfigService.isDev).toBe(true);
    expect(envConfigService.isProd).toBe(false);
  });
});

describe("An environment configuration loader", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([
    {},
    {
      NODE_ENV: "development",
      PORT: "3030",
      DATABASE_URL: "postgresql://postgres@localhost:5432/automo?schema=public",
    },
    {
      NODE_ENV: "production",
      PORT: "8080",
      DATABASE_URL: "postgresql://automo@192.168.1.10:5433",
    },
  ])("should load the environment configuration", async (env) => {
    process.env = env;

    // Needed the dynamic import to avoid Jest overwriting the process.env.NODE_ENV to 'test'
    const { EnvConfigService: ConfigServiceLoader } = await import("../index");

    expect(() => ConfigServiceLoader.load()).not.toThrow();
  });

  it.each([
    {
      NODE_ENV: "foo",
      PORT: "8080",
      DATABASE_URL: "postgresql://postgres@localhost:5432/automo?schema=public",
    },
    {
      NODE_ENV: "production",
      PORT: "foo",
      DATABASE_URL: "postgresql://postgres@localhost:5432/automo?schema=public",
    },
    {
      NODE_ENV: "production",
      PORT: "8080",
      DATABASE_URL: "foo",
    },
  ])("should throw an error when the environment configuration is invalid", async (env) => {
    process.env = env;

    // Needed the dynamic import to avoid Jest overwriting the process.env.NODE_ENV to 'test'
    const { EnvConfigService: ConfigServiceLoader } = await import("../index");

    expect(() => ConfigServiceLoader.load()).toThrow();
  });
});
