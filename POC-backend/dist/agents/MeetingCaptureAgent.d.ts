interface MeetingAnalysis {
    summary: string;
    sentiment: number;
    nextSteps: {
        actions: string[];
        followUpDate?: Date;
        priority: "high" | "medium" | "low";
    };
    keyTopics: string[];
    riskFactors?: string[];
}
export declare class MeetingCaptureAgent {
    private openai;
    private transcriber;
    private db;
    constructor();
    processAudioMeeting(customerId: string, audioFileUrl: string): Promise<MeetingAnalysis>;
    processTextMeeting(customerId: string, notes: string): Promise<MeetingAnalysis>;
    private analyzeMeeting;
    private parseAnalysis;
    private saveMeetingRecord;
}
export {};
