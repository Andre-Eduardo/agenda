import type { ExecutionContext } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { createParamDecorator } from "@nestjs/common/decorators/http/create-route-param-metadata.decorator";
import type { HttpArgumentsHost } from "@nestjs/common/interfaces";
import type { Request } from "express";
import { mock, mockDeep } from "jest-mock-extended";
import type { Actor } from "../../../../domain/@shared/actor";
import { UserId } from "../../../../domain/user/entities";
import { RequestActor } from "../request-actor.decorator";

function getParamDecoratorFactory(): Parameters<typeof createParamDecorator>[0] {
  class TestDecorator {
    public test(@RequestActor() actor: Actor) {
      return actor;
    }
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestDecorator, "test");

  return args[Object.keys(args)[0]].factory;
}

describe("A RequestActor decorator", () => {
  it("should return the actor from the request", () => {
    const actor: Actor = {
      userId: UserId.generate(),
      ip: "127.0.0.1",
    };
    const context = mock<ExecutionContext>();
    const request = mock<Request>({ actor });
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    const factory = getParamDecoratorFactory();
    const result = factory(null, context);

    expect(result).toEqual(actor);
  });
});
