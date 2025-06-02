interface TranscriptionResult {
    text: string;
    confidence: number;
    speakerLabels?: string[];
}
export declare class AudioTranscriber {
    private openai;
    private tempDir;
    constructor();
    transcribe(audioFileUrl: string): Promise<TranscriptionResult>;
    private downloadFile;
    private cleanupTempFile;
    private calculateConfidence;
    private detectSpeakers;
}
export {};
