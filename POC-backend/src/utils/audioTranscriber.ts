import { OpenAI } from "openai";
import * as fs from "fs";
import { createReadStream } from "fs";
import { config } from "../config/env";
import { APIError } from "./errorHandler";
import axios from "axios";
import { createWriteStream } from "fs";
import { promisify } from "util";
import { pipeline } from "stream";
import * as path from "path";
import * as os from "os";
import type { TranscriptionCreateParams } from "openai/resources/audio/transcriptions";

const streamPipeline = promisify(pipeline);

interface TranscriptionResult {
  text: string;
  confidence: number;
  speakerLabels?: string[];
}

interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface WhisperResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
}

export class AudioTranscriber {
  private openai: OpenAI;
  private tempDir: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
    this.tempDir = os.tmpdir();
  }

  async transcribe(audioFileUrl: string): Promise<TranscriptionResult> {
    let tempFilePath: string | undefined;

    try {
      // Download the audio file to a temporary location
      tempFilePath = await this.downloadFile(audioFileUrl);

      // Transcribe using OpenAI's Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: createReadStream(tempFilePath),
        model: "whisper-1",
        language: "en",
        response_format: "verbose_json",
      });

      return {
        text: transcription.text,
        confidence: this.calculateConfidence(transcription),
        speakerLabels: this.detectSpeakers(transcription),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new APIError(500, `Transcription failed: ${error.message}`);
      }
      throw new APIError(500, "Transcription failed");
    } finally {
      // Clean up the temporary file if it exists
      if (tempFilePath) {
        await this.cleanupTempFile(tempFilePath);
      }
    }
  }

  private async downloadFile(url: string): Promise<string> {
    try {
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
      });

      const tempFilePath = path.join(this.tempDir, `audio-${Date.now()}.mp3`);
      await streamPipeline(response.data, createWriteStream(tempFilePath));
      return tempFilePath;
    } catch (error) {
      if (error instanceof Error) {
        throw new APIError(
          500,
          `Failed to download audio file: ${error.message}`
        );
      }
      throw new APIError(500, "Failed to download audio file");
    }
  }

  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      // Just log the error since this is cleanup
      console.error("Failed to cleanup temporary file:", error);
    }
  }

  private calculateConfidence(transcription: any): number {
    // Simplified confidence calculation
    // In a real implementation, this would analyze various factors
    // from the transcription response
    return 0.85;
  }

  private detectSpeakers(transcription: any): string[] {
    // In a real implementation, this would use speaker diarization
    // to identify different speakers. This is a simplified version.
    return ["Speaker 1", "Speaker 2"];
  }
}
