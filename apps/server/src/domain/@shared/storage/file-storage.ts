export interface UploadInfo {
  url: string;
  fields?: Record<string, string>;
  method: "PUT" | "POST";
}

export interface FileStorage {
  prepareUpload(path: string, mimeType: string, checksum?: string): Promise<UploadInfo | null>;
  promote(tempPath: string, finalPath: string): Promise<void>;
  getFileInfo(path: string): Promise<{ size: number; checksum: string } | null>;
  delete(path: string): Promise<void>;
  /** Stores a buffer directly (server-side upload) and returns the public URL. */
  storeBuffer(path: string, buffer: Buffer, mimeType: string): Promise<string>;
}

export const FileStorage = Symbol("FileStorage");

export const FilePaths = {
  temp: (filename: string) => `temp/${filename}`,
  final: (filename: string) => `files/${filename}`,
};

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];
