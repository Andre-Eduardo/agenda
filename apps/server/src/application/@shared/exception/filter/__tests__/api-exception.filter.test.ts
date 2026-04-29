import type { ArgumentsHost } from "@nestjs/common";
import type { HttpArgumentsHost } from "@nestjs/common/interfaces";
import type { HttpAdapterHost } from "@nestjs/core";
import type { ExpressAdapter } from "@nestjs/platform-express";
import { mockDeep } from "jest-mock-extended";
import { PreconditionException } from "../../../../../domain/@shared/exceptions";
import { ApiExceptionFilter } from "../index";

describe("An API exception filter", () => {
  const adapterHost = mockDeep<HttpAdapterHost<ExpressAdapter>>();
  const filter = new ApiExceptionFilter(adapterHost);
  const host = mockDeep<ArgumentsHost>();
  const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

  it("should catch and format expected exceptions", () => {
    const exception = new PreconditionException("A precondition failed");
    const requestUrl = "/api/v1/test";

    jest.spyOn(host, "switchToHttp").mockReturnValue(httpArgumentsHost);
    jest.spyOn(adapterHost.httpAdapter, "getRequestUrl").mockReturnValue(requestUrl);

    filter.catch(exception, host);

    expect(adapterHost.httpAdapter.setHeader).toHaveBeenCalledTimes(1);
    expect(adapterHost.httpAdapter.setHeader).toHaveBeenCalledWith(
      httpArgumentsHost.getResponse(),
      "Content-Type",
      "application/problem+json",
    );

    expect(adapterHost.httpAdapter.reply).toHaveBeenCalledTimes(1);
    expect(adapterHost.httpAdapter.reply).toHaveBeenCalledWith(
      httpArgumentsHost.getResponse(),
      {
        title: "Preconditions not met for the required operation",
        type: "https://developer.mozilla.org/docs/Web/HTTP/Status/409",
        detail: "A precondition failed",
        status: 409,
        instance: requestUrl,
      },
      409,
    );
  });

  it("should catch and format unexpected error", () => {
    const exception = new Error("An internal error");
    const requestUrl = "/api/v1/test";

    jest.spyOn(host, "switchToHttp").mockReturnValue(httpArgumentsHost);
    jest.spyOn(adapterHost.httpAdapter, "getRequestUrl").mockReturnValue(requestUrl);

    filter.catch(exception, host);

    expect(adapterHost.httpAdapter.setHeader).toHaveBeenCalledTimes(1);
    expect(adapterHost.httpAdapter.setHeader).toHaveBeenCalledWith(
      httpArgumentsHost.getResponse(),
      "Content-Type",
      "application/problem+json",
    );

    expect(adapterHost.httpAdapter.reply).toHaveBeenCalledTimes(1);
    expect(adapterHost.httpAdapter.reply).toHaveBeenCalledWith(
      httpArgumentsHost.getResponse(),
      {
        title: "Unexpected error",
        type: "https://developer.mozilla.org/docs/Web/HTTP/Status/500",
        detail: "An unexpected error occurred.",
        status: 500,
        instance: requestUrl,
      },
      500,
    );
  });
});
