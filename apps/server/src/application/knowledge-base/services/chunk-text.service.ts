import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";

export type TextChunk = {
  content: string;
  contentHash: string;
  chunkIndex: number;
};

export type ChunkTextInput = {
  text: string;
  /** Max chars per chunk (default 800) */
  maxChunkSize?: number;
  /** Overlap chars between consecutive chunks (default 150) */
  overlapSize?: number;
};

/**
 * Splits plain text into overlapping chunks for embedding and indexing.
 * Reuses the paragraph-based chunking strategy from IndexPatientChunksService.
 */
@Injectable()
export class ChunkTextService {
  execute(input: ChunkTextInput): TextChunk[] {
    const { text, maxChunkSize = 800, overlapSize = 150 } = input;

    const normalized = this.normalizeText(text);

    if (!normalized) return [];

    const paragraphs = normalized.split(/\n{2,}/);
    const chunks: TextChunk[] = [];
    let buffer = "";
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();

      if (!trimmed) continue;

      if (buffer.length + trimmed.length + 1 > maxChunkSize && buffer.length > 0) {
        chunks.push(this.makeChunk(buffer.trim(), chunkIndex++));
        // Carry overlap into next chunk
        const words = buffer.split(" ");
        const overlapWords: string[] = [];
        let overlapLen = 0;

        for (let i = words.length - 1; i >= 0 && overlapLen < overlapSize; i--) {
          overlapWords.unshift(words[i]);
          overlapLen += words[i].length + 1;
        }

        buffer = `${overlapWords.join(" ")} ${trimmed}`;
      } else {
        buffer = buffer ? `${buffer}\n\n${trimmed}` : trimmed;
      }
    }

    if (buffer.trim()) {
      chunks.push(this.makeChunk(buffer.trim(), chunkIndex));
    }

    return chunks;
  }

  private makeChunk(content: string, chunkIndex: number): TextChunk {
    return {
      content,
      contentHash: createHash("sha256").update(content).digest("hex").slice(0, 16),
      chunkIndex,
    };
  }

  private normalizeText(text: string): string {
    return text
      .replaceAll("\r\n", "\n")
      .replaceAll("\r", "\n")
      .replaceAll(/[ \t]+/g, " ")
      .replaceAll(/\n{4,}/g, "\n\n\n")
      .trim();
  }
}
