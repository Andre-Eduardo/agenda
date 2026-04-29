import type { DomainEventProps } from "@domain/event";
import { DomainEvent } from "@domain/event";
import type { UploadFile } from "@domain/file/entities";

export class FileReadyEvent extends DomainEvent {
  static readonly type = "FILE_READY";
  readonly file: UploadFile;

  constructor(props: DomainEventProps<FileReadyEvent>) {
    super(FileReadyEvent.type, props.timestamp);
    this.file = props.file;
  }
}
