"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioTranscriber = void 0;
const openai_1 = require("openai");
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
const axios_1 = __importDefault(require("axios"));
const fs_2 = require("fs");
const util_1 = require("util");
const stream_1 = require("stream");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const streamPipeline = (0, util_1.promisify)(stream_1.pipeline);
class AudioTranscriber {
    constructor() {
        this.openai = new openai_1.OpenAI({
            apiKey: env_1.config.OPENAI_API_KEY,
        });
        this.tempDir = os.tmpdir();
    }
    async transcribe(audioFileUrl) {
        let tempFilePath;
        try {
            // Download the audio file to a temporary location
            tempFilePath = await this.downloadFile(audioFileUrl);
            // Transcribe using OpenAI's Whisper API
            const transcription = await this.openai.audio.transcriptions.create({
                file: (0, fs_1.createReadStream)(tempFilePath),
                model: "whisper-1",
                language: "en",
                response_format: "verbose_json",
            });
            return {
                text: transcription.text,
                confidence: this.calculateConfidence(transcription),
                speakerLabels: this.detectSpeakers(transcription),
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new errorHandler_1.APIError(500, `Transcription failed: ${error.message}`);
            }
            throw new errorHandler_1.APIError(500, "Transcription failed");
        }
        finally {
            // Clean up the temporary file if it exists
            if (tempFilePath) {
                await this.cleanupTempFile(tempFilePath);
            }
        }
    }
    async downloadFile(url) {
        try {
            const response = await (0, axios_1.default)({
                method: "GET",
                url: url,
                responseType: "stream",
            });
            const tempFilePath = path.join(this.tempDir, `audio-${Date.now()}.mp3`);
            await streamPipeline(response.data, (0, fs_2.createWriteStream)(tempFilePath));
            return tempFilePath;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new errorHandler_1.APIError(500, `Failed to download audio file: ${error.message}`);
            }
            throw new errorHandler_1.APIError(500, "Failed to download audio file");
        }
    }
    async cleanupTempFile(filePath) {
        try {
            await fs.promises.unlink(filePath);
        }
        catch (error) {
            // Just log the error since this is cleanup
            console.error("Failed to cleanup temporary file:", error);
        }
    }
    calculateConfidence(transcription) {
        // Simplified confidence calculation
        // In a real implementation, this would analyze various factors
        // from the transcription response
        return 0.85;
    }
    detectSpeakers(transcription) {
        // In a real implementation, this would use speaker diarization
        // to identify different speakers. This is a simplified version.
        return ["Speaker 1", "Speaker 2"];
    }
}
exports.AudioTranscriber = AudioTranscriber;
//# sourceMappingURL=audioTranscriber.js.map