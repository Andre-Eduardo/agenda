import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Actor } from "@domain/@shared/actor";
import { InvalidInputException } from "@domain/@shared/exceptions";
import { UploadPermission } from "@domain/auth";
import { FileStorageType } from "@domain/file/entities";
import { EnvConfigService } from "@infrastructure/config";
import { Authorize } from "@application/@shared/auth";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import {
  PrepareUploadInputDto,
  PreparedUploadDto,
  TempUploadDto,
  UploadLocalInputDto,
} from "@application/upload/dtos";
import { FileValidationPipe } from "@application/upload/pipes/file-validation.pipe";
import { PrepareUploadService } from "@application/upload/services/prepare-upload.service";

@ApiTags("Upload")
@Controller("upload")
export class UploadController {
  constructor(
    private readonly prepareUploadService: PrepareUploadService,
    private readonly config: EnvConfigService,
    private readonly fileValidationPipe: FileValidationPipe,
  ) {}

  @ApiOperation({
    summary: "Prepare a file upload and get upload instructions",
    responses: [{ status: 200, description: "Upload instructions", type: PreparedUploadDto }],
  })
  @Authorize(UploadPermission.PREPARE)
  @HttpCode(HttpStatus.OK)
  @Post("prepare")
  prepareUpload(
    @RequestActor() actor: Actor,
    @Body() payload: PrepareUploadInputDto,
  ): Promise<PreparedUploadDto> {
    return this.prepareUploadService.execute({ actor, payload });
  }

  @ApiOperation({
    summary: "Upload a file directly to the server (local storage only)",
    responses: [{ status: 200, description: "Temp file stored", type: TempUploadDto }],
  })
  @ApiConsumes("multipart/form-data")
  @Authorize(UploadPermission.UPLOAD)
  @HttpCode(HttpStatus.OK)
  @Post("local")
  @UseInterceptors(FileInterceptor("file"))
  uploadLocal(
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: UploadLocalInputDto,
  ): TempUploadDto {
    if (this.config.storage.type !== FileStorageType.LOCAL) {
      throw new InvalidInputException(
        "Local upload is not available with the current storage configuration.",
      );
    }

    this.fileValidationPipe.transform(file);

    return { fileId: payload.tempPath, tempPath: payload.tempPath };
  }
}
