import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Actor } from "@domain/@shared/actor";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import {
  DocumentPermissionDto,
  GrantDocumentPermissionDto,
} from "@application/document-permission/dtos";
import { GrantDocumentPermissionService } from "@application/document-permission/services";

@ApiTags("DocumentPermission")
@Controller("document-permissions")
export class DocumentPermissionController {
  constructor(private readonly grantService: GrantDocumentPermissionService) {}

  @ApiOperation({
    summary: "Grant or revoke a per-document permission",
    responses: [{ status: 201, description: "Permission granted", type: DocumentPermissionDto }],
  })
  @Post()
  grantPermission(
    @RequestActor() actor: Actor,
    @Body() payload: GrantDocumentPermissionDto,
  ): Promise<DocumentPermissionDto> {
    return this.grantService.execute({ actor, payload });
  }
}
