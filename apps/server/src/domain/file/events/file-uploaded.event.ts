import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { UploadFile } from "@domain/file/entities";

export class FileUploadedEvent extends DomainEvent {
  static readonly type = "FILE_UPLOADED";
  readonly file: UploadFile;

  constructor(props: DomainEventProps<FileUploadedEvent>) {
    super(FileUploadedEvent.type, props.timestamp);
    this.file = props.file;
  }
}
